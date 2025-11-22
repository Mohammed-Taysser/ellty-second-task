import { Request, Response } from 'express';
import { Prisma } from 'prisma/generated';

import {
  CreateOperationInput,
  GetOperationByIdParams,
  GetOperationsListQuery,
} from './operation.validator';

import prisma from '@/apps/prisma';
import { AuthenticatedRequest } from '@/types/import';
import { NotFoundError } from '@/utils/errors.utils';
import { sendPaginatedResponse, sendSuccessResponse } from '@/utils/response.utils';

async function getOperations(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    unknown,
    unknown,
    unknown,
    GetOperationsListQuery
  >;

  const query = authenticatedRequest.parsedQuery;

  const skip = (query.page - 1) * query.limit;

  const filters: Prisma.OperationWhereInput = {};

  if (query.operationType) {
    filters.operationType = {
      in: query.operationType,
    };
  }

  const [data, total] = await Promise.all([
    prisma.operation.findMany({
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
      },
    }),
    prisma.operation.count({
      where: filters,
    }),
  ]);

  sendPaginatedResponse({
    response,
    message: 'All operations',
    data,
    metadata: {
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    },
  });
}

async function getOperationsList(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    unknown,
    unknown,
    unknown,
    GetOperationsListQuery
  >;

  const query = authenticatedRequest.parsedQuery;

  const filters: Prisma.OperationWhereInput = {};

  if (query.operationType) {
    filters.operationType = {
      in: query.operationType,
    };
  }

  const operations = await prisma.operation.findMany({
    select: {
      id: true,
      operationType: true,
    },
    where: filters,
  });

  sendSuccessResponse({ response, message: 'Operations list', data: operations });
}

async function getOperationById(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    GetOperationByIdParams,
    unknown,
    unknown,
    unknown
  >;

  const { params } = authenticatedRequest;

  const operation = await prisma.operation.findUnique({
    where: { id: params.operationId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!operation) {
    throw new NotFoundError('Operation not found');
  }

  sendSuccessResponse({
    response,
    message: 'Operation found',
    data: operation,
  });
}

async function createOperation(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    unknown,
    unknown,
    CreateOperationInput,
    unknown
  >;

  const { body, user } = authenticatedRequest;

  let beforeValue: number;
  let discussionId: number;

  if (body.parentId === null || body.parentId === undefined) {
    // Root operation: get starting value from discussion
    if (!body.discussionId) {
      return response.status(400).json({ error: 'discussionId is required for root operations' });
    }

    const discussion = await prisma.discussion.findUnique({
      where: { id: body.discussionId },
    });

    if (!discussion) {
      throw new NotFoundError('Discussion not found');
    }

    beforeValue = discussion.startingValue;
    discussionId = discussion.id;
  } else {
    // Child operation: get value from parent
    const parentOperation = await prisma.operation.findUnique({
      where: { id: body.parentId },
    });

    if (!parentOperation) {
      throw new NotFoundError('Parent operation not found');
    }

    beforeValue = parentOperation.afterValue;
    discussionId = parentOperation.discussionId;
  }

  // Check if discussion is ended
  const discussion = await prisma.discussion.findUnique({
    where: { id: discussionId },
    select: { isEnded: true },
  });

  if (discussion?.isEnded) {
    return response.status(400).json({ error: 'Cannot add operation to an ended discussion' });
  }

  // Validate division by zero
  if (body.operation === 'DIVIDE' && body.value === 0) {
    return response.status(400).json({ error: 'Cannot divide by zero' });
  }

  // Calculate afterValue based on operation type
  let afterValue = beforeValue;
  switch (body.operation) {
    case 'ADD':
      afterValue = beforeValue + body.value;
      break;
    case 'SUBTRACT':
      afterValue = beforeValue - body.value;
      break;
    case 'MULTIPLY':
      afterValue = beforeValue * body.value;
      break;
    case 'DIVIDE':
      afterValue = beforeValue / body.value;
      break;
  }

  const operation = await prisma.operation.create({
    data: {
      discussionId,
      parentId: body.parentId || null,
      title: `${body.operation} ${body.value}`,
      operationType: body.operation,
      value: body.value,
      beforeValue,
      afterValue,
      createdBy: user.id,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  sendSuccessResponse({
    response,
    message: 'Operation created',
    data: operation,
    statusCode: 201,
  });
}

const operationController = {
  createOperation,
  getOperationById,
  getOperations,
  getOperationsList,
};

export default operationController;
