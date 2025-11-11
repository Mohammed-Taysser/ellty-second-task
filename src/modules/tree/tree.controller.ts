import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

import {
  CreateTreeInput,
  GetTreeByIdParams,
  GetTreesListQuery,
  UpdateTreeInput,
} from './tree.validator';

import prisma from '@/apps/prisma';
import { AuthenticatedRequest } from '@/types/import';
import { NotFoundError } from '@/utils/errors.utils';
import { sendPaginatedResponse, sendSuccessResponse } from '@/utils/response.utils';

async function getTrees(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    unknown,
    unknown,
    unknown,
    GetTreesListQuery
  >;

  const query = authenticatedRequest.parsedQuery;

  const skip = (query.page - 1) * query.limit;

  const filters: Prisma.TreeWhereInput = {};

  if (query.title) {
    filters.title = {
      contains: query.title,
    };
  }

  const [data, total] = await Promise.all([
    prisma.tree.findMany({
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
        nodes: {
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
    prisma.tree.count({
      where: filters,
    }),
  ]);

  sendPaginatedResponse({
    response,
    message: 'All trees',
    data,
    metadata: {
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    },
  });
}

async function getTreesList(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    unknown,
    unknown,
    unknown,
    GetTreesListQuery
  >;

  const query = authenticatedRequest.parsedQuery;

  const filters: Prisma.TreeWhereInput = {};

  if (query.title) {
    filters.title = {
      contains: query.title,
    };
  }

  const trees = await prisma.tree.findMany({
    select: {
      id: true,
      title: true,
    },
    where: filters,
  });

  sendSuccessResponse({ response, message: 'Trees list', data: trees });
}

async function getTreeById(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    GetTreeByIdParams,
    unknown,
    unknown,
    unknown
  >;

  const { params } = authenticatedRequest;

  const tree = await prisma.tree.findUnique({
    where: { id: params.treeId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      nodes: {
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

  if (!tree) {
    throw new NotFoundError('Tree not found');
  }

  sendSuccessResponse({
    response,
    message: 'Tree found',
    data: tree,
  });
}

async function createTree(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    unknown,
    unknown,
    CreateTreeInput,
    unknown
  >;

  const { body, user } = authenticatedRequest;

  const treeWithStartNode = await prisma.tree.create({
    data: {
      title: body.title,
      createdBy: user.id,
      nodes: {
        create: [
          {
            operation: 'START',
            rightOperand: body.startingNumber,
            value: body.startingNumber,
            createdBy: user.id,
          },
        ],
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      nodes: {
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
    message: 'Tree created',
    data: treeWithStartNode,
    statusCode: 201,
  });
}

async function updateTree(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    GetTreeByIdParams,
    unknown,
    UpdateTreeInput,
    unknown
  >;

  const { body, params } = authenticatedRequest;

  const tree = await prisma.tree.findUnique({
    where: { id: params.treeId },
  });

  if (!tree) {
    throw new NotFoundError('Tree not found');
  }

  const updatedTree = await prisma.tree.update({
    where: { id: params.treeId },
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
      nodes: {
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
    message: 'Tree updated',
    data: updatedTree,
  });
}

async function deleteTree(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    GetTreeByIdParams,
    unknown,
    unknown,
    unknown
  >;

  const treeId = authenticatedRequest.params.treeId;

  const tree = await prisma.tree.findUnique({
    where: { id: treeId },
  });

  if (!tree) {
    throw new NotFoundError('Tree not found');
  }

  const deletedTree = await prisma.tree.delete({
    where: { id: treeId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      nodes: {
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
    message: 'Tree deleted',
    data: deletedTree,
  });
}

const treeController = {
  createTree,
  deleteTree,
  getTreeById,
  getTrees,
  getTreesList,
  updateTree,
};

export default treeController;
