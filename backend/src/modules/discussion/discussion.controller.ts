import { Request, Response } from 'express';
import { Prisma } from 'prisma/generated';

import {
  CreateDiscussionInput,
  GetDiscussionByIdParams,
  GetDiscussionsListQuery,
  UpdateDiscussionInput,
} from './discussion.validator';

import prisma from '@/apps/prisma';
import { AuthenticatedRequest } from '@/types/import';
import { NotFoundError } from '@/utils/errors.utils';
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
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        operations: {
          orderBy: { id: 'asc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
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
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      operations: {
        orderBy: { id: 'asc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!discussion) {
    throw new NotFoundError('Discussion not found');
  }

  sendSuccessResponse({
    response,
    message: 'Discussion found',
    data: discussion,
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
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      operations: {
        orderBy: { id: 'asc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
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

  const { body, params } = authenticatedRequest;

  const discussion = await prisma.discussion.findUnique({
    where: { id: params.discussionId },
  });

  if (!discussion) {
    throw new NotFoundError('Discussion not found');
  }

  const updatedDiscussion = await prisma.discussion.update({
    where: { id: params.discussionId },
    data: {
      ...body,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      operations: {
        orderBy: { id: 'asc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

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

  const discussionId = authenticatedRequest.params.discussionId;

  const discussion = await prisma.discussion.findUnique({
    where: { id: discussionId },
  });

  if (!discussion) {
    throw new NotFoundError('Discussion not found');
  }

  const deletedDiscussion = await prisma.discussion.delete({
    where: { id: discussionId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      operations: {
        orderBy: { id: 'asc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  sendSuccessResponse({
    response,
    message: 'Discussion deleted',
    data: deletedDiscussion,
  });
}

const discussionController = {
  createDiscussion,
  deleteDiscussion,
  getDiscussionById,
  getDiscussions,
  getDiscussionsList,
  updateDiscussion,
};

export default discussionController;
