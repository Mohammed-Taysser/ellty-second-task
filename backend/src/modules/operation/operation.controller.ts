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

  const parentOperation = await prisma.operation.findUnique({
    where: { id: body.parentId },
  });

  if (!parentOperation) {
    throw new NotFoundError('Parent operation not found');
  }

  if (body.operation === 'DIVIDE' && body.value === 0) {
    return response.status(400).json({ error: 'cannot divide by zero' });
  }

  let operationValue = 0;

  switch (body.operation) {
    case 'ADD':
      operationValue = parentOperation.totals + body.value;
      break;
    case 'SUBTRACT':
      operationValue = parentOperation.totals - body.value;
      break;
    case 'MULTIPLY':
      operationValue = parentOperation.totals * body.value;
      break;
    case 'DIVIDE':
      operationValue = parentOperation.totals / body.value;
      break;
  }

  const operation = await prisma.operation.create({
    data: {
      discussionId: parentOperation.discussionId,
      parentId: parentOperation.id,
      operationType: body.operation,
      totals: operationValue,
      createdBy: user.id,
      value: body.value,
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
