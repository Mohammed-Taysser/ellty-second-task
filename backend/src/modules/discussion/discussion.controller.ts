import { Prisma } from '@prisma';
import { Request, Response } from 'express';

import {
  CreateDiscussionInput,
  GetDiscussionByIdParams,
  GetDiscussionsListQuery,
  UpdateDiscussionInput,
} from './discussion.validator';

import prisma from '@/apps/prisma';
import cacheService from '@/services/cache.service';
import { AuthenticatedRequest } from '@/types/import';
import { BadRequestError, ForbiddenError, NotFoundError } from '@/utils/errors.utils';
import { userSelectBasic } from '@/utils/prisma-selects.utils';
import { sendPaginatedResponse, sendSuccessResponse } from '@/utils/response.utils';

async function getDiscussions(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    unknown,
    unknown,
    unknown,
    GetDiscussionsListQuery
  >;

  const query = authenticatedRequest.parsedQuery;

  const skip = (query.page - 1) * query.limit;

  const filters: Prisma.DiscussionWhereInput = {};

  if (query.title) {
    filters.title = {
      contains: query.title,
    };
  }

  if (query.userId) {
    filters.user = {
      id: {
        equals: query.userId,
      },
    };
  }

  const [data, total] = await Promise.all([
    prisma.discussion.findMany({
      skip,
      take: query.limit,
      orderBy: { createdAt: 'desc' },
      where: filters,
      include: {
        user: {
          select: userSelectBasic,
        },
        operations: {
          orderBy: { id: 'asc' },
          include: {
            user: {
              select: userSelectBasic,
            },
          },
        },
      },
    }),
    prisma.discussion.count({
      where: filters,
    }),
  ]);

  sendPaginatedResponse({
    response,
    message: 'All discussions',
    data,
    metadata: {
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    },
  });
}

async function getDiscussionsList(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    unknown,
    unknown,
    unknown,
    GetDiscussionsListQuery
  >;

  const query = authenticatedRequest.parsedQuery;

  const filters: Prisma.DiscussionWhereInput = {};

  if (query.title) {
    filters.title = {
      contains: query.title,
    };
  }

  if (query.userId) {
    filters.user = {
      id: {
        equals: query.userId,
      },
    };
  }

  const discussions = await prisma.discussion.findMany({
    select: {
      id: true,
      title: true,
    },
    where: filters,
  });

  sendSuccessResponse({ response, message: 'Discussions list', data: discussions });
}

async function getDiscussionById(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    GetDiscussionByIdParams,
    unknown,
    unknown,
    unknown
  >;

  const { params } = authenticatedRequest;

  const discussion = await prisma.discussion.findUnique({
    where: { id: params.discussionId },
    include: {
      user: {
        select: userSelectBasic,
      },
      operations: {
        orderBy: { id: 'asc' },
        include: {
          user: {
            select: userSelectBasic,
          },
        },
      },
    },
  });

  if (!discussion) {
    throw new NotFoundError('Discussion not found');
  }

  // Handle root nodes caching
  let rootResults = await cacheService.getRootNodesCache(discussion.id);

  if (rootResults) {
    console.log(`[Cache] Serving root nodes results for discussion ${discussion.id} from Redis`);
  } else {
    // Calculate and set cache if not found
    rootResults = (discussion.operations || [])
      .filter((op) => op.parentId === null)
      .reduce((acc: Record<number, number>, op) => {
        acc[op.id] = op.afterValue;
        return acc;
      }, {});

    await cacheService.setRootNodesCache(discussion.id, rootResults);
    console.log(`[Cache] Set root nodes results for discussion ${discussion.id}`);
  }

  sendSuccessResponse({
    response,
    message: 'Discussion found',
    data: {
      ...discussion,
      rootResults, // Include cached/calculated root results
    },
  });
}

async function createDiscussion(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    unknown,
    unknown,
    CreateDiscussionInput,
    unknown
  >;

  const { body, user } = authenticatedRequest;

  const discussionWithStartOperation = await prisma.discussion.create({
    data: {
      title: body.title,
      createdBy: user.id,
      startingValue: body.startingValue,
    },
    include: {
      user: {
        select: userSelectBasic,
      },
      operations: {
        orderBy: { id: 'asc' },
        include: {
          user: {
            select: userSelectBasic,
          },
        },
      },
    },
  });

  sendSuccessResponse({
    response,
    message: 'Discussion created',
    data: discussionWithStartOperation,
    statusCode: 201,
  });
}

async function updateDiscussion(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    GetDiscussionByIdParams,
    unknown,
    UpdateDiscussionInput,
    unknown
  >;

  const { body, params, user } = authenticatedRequest;

  const discussion = await prisma.discussion.findUnique({
    where: { id: params.discussionId },
  });

  if (!discussion) {
    throw new NotFoundError('Discussion not found');
  }

  if (discussion.createdBy !== user.id) {
    throw new ForbiddenError('You do not have permission to update this discussion');
  }

  const updatedDiscussion = await prisma.discussion.update({
    where: { id: params.discussionId },
    data: {
      ...body,
    },
    include: {
      user: {
        select: userSelectBasic,
      },
      operations: {
        orderBy: { id: 'asc' },
        include: {
          user: {
            select: userSelectBasic,
          },
        },
      },
    },
  });

  // Invalidate root nodes cache
  await cacheService.invalidateRootNodesCache(params.discussionId);

  sendSuccessResponse({
    response,
    message: 'Discussion updated',
    data: updatedDiscussion,
  });
}

async function deleteDiscussion(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    GetDiscussionByIdParams,
    unknown,
    unknown,
    unknown
  >;

  const { params, user } = authenticatedRequest;
  const discussionId = params.discussionId;

  const discussion = await prisma.discussion.findUnique({
    where: { id: discussionId },
  });

  if (!discussion) {
    throw new NotFoundError('Discussion not found');
  }

  if (discussion.createdBy !== user.id) {
    throw new ForbiddenError('You do not have permission to delete this discussion');
  }

  const deletedDiscussion = await prisma.discussion.delete({
    where: { id: discussionId },
    include: {
      user: {
        select: userSelectBasic,
      },
      operations: {
        orderBy: { id: 'asc' },
        include: {
          user: {
            select: userSelectBasic,
          },
        },
      },
    },
  });

  // Invalidate root nodes cache
  await cacheService.invalidateRootNodesCache(discussionId);

  sendSuccessResponse({
    response,
    message: 'Discussion deleted',
    data: deletedDiscussion,
  });
}

async function endDiscussion(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    GetDiscussionByIdParams,
    unknown,
    unknown,
    unknown
  >;

  const { params, user } = authenticatedRequest;
  const discussionId = params.discussionId;

  const discussion = await prisma.discussion.findUnique({
    where: { id: discussionId },
  });

  if (!discussion) {
    throw new NotFoundError('Discussion not found');
  }

  if (discussion.createdBy !== user.id) {
    throw new ForbiddenError('You do not have permission to end this discussion');
  }

  if (discussion.isEnded) {
    throw new BadRequestError('Discussion is already ended');
  }

  const updatedDiscussion = await prisma.discussion.update({
    where: { id: discussionId },
    data: {
      isEnded: true,
      endedAt: new Date(),
    },
    include: {
      user: {
        select: userSelectBasic,
      },
      operations: {
        orderBy: { id: 'asc' },
        include: {
          user: {
            select: userSelectBasic,
          },
        },
      },
    },
  });

  sendSuccessResponse({
    response,
    message: 'Discussion ended',
    data: updatedDiscussion,
  });
}

const discussionController = {
  createDiscussion,
  deleteDiscussion,
  getDiscussionById,
  getDiscussions,
  getDiscussionsList,
  updateDiscussion,
  endDiscussion,
};

export default discussionController;
