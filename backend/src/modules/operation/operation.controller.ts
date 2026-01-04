import { Prisma } from '@prisma';
import { Request, Response } from 'express';

import operationService from './operation.service';
import {
  CreateOperationInput,
  GetOperationByIdParams,
  GetOperationsListQuery,
  UpdateOperationInput,
} from './operation.validator';

import prisma from '@/apps/prisma';
import cacheService from '@/services/cache.service';
import { AuthenticatedRequest } from '@/types/import';
import { calculateOperationDepth, validateTreeDepth } from '@/utils/depth.utils';
import { BadRequestError, ForbiddenError, NotFoundError } from '@/utils/errors.utils';
import { userSelectBasic } from '@/utils/prisma-selects.utils';
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
          select: userSelectBasic,
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
        select: userSelectBasic,
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

  // Determine beforeValue and depth based on parent or discussion
  let beforeValue: number;
  let depth: number;
  let discussion: Awaited<ReturnType<typeof prisma.discussion.findUnique>>; // To store the full discussion object

  const parentId = body.parentId;

  if (parentId) {
    const parentOperation = await prisma.operation.findUnique({
      where: { id: parentId },
      select: {
        afterValue: true,
        depth: true,
        discussion: {
          select: {
            id: true,
            title: true,
            startingValue: true,
            createdBy: true,
            createdAt: true,
            updatedAt: true,
            isEnded: true,
            endedAt: true,
          },
        },
      },
    });

    if (!parentOperation) {
      throw new NotFoundError('Parent operation not found');
    }

    beforeValue = parentOperation.afterValue;
    depth = calculateOperationDepth(parentOperation.depth);
    discussion = parentOperation.discussion;

    // Validate depth doesn't exceed maximum
    validateTreeDepth(parentOperation.depth);
  } else {
    // Root operation: get starting value from discussion
    if (!body.discussionId) {
      throw new BadRequestError('discussionId is required for root operations');
    }

    discussion = await prisma.discussion.findUnique({
      where: { id: body.discussionId },
    });

    if (!discussion) {
      throw new NotFoundError('Discussion not found');
    }
    beforeValue = discussion.startingValue;
    depth = 1; // Root operation has depth 1
  }

  // Check if discussion is ended
  if (discussion?.isEnded) {
    throw new BadRequestError('Cannot add operation to an ended discussion');
  }

  // Validate division by zero
  if (body.operationType === 'DIVIDE' && body.value === 0) {
    throw new BadRequestError('Cannot divide by zero');
  }

  // Calculate the afterValue based on operation type
  const operationType = body.operationType;
  const operationValue = body.value;

  const afterValue = operationService.calculateOperation(
    beforeValue,
    operationType,
    operationValue
  );

  // Create the operation
  const operation = await prisma.operation.create({
    data: {
      discussionId: discussion.id,
      parentId: body.parentId || null,
      title: body.title || `${body.operationType} ${body.value}`,
      operationType: body.operationType,
      value: body.value,
      beforeValue,
      afterValue,
      depth,
      createdBy: user.id,
    },
    include: {
      user: {
        select: userSelectBasic,
      },
    },
  });

  // Invalidate root nodes cache
  await cacheService.invalidateRootNodesCache(discussion.id);

  sendSuccessResponse({
    response,
    message: 'Operation created',
    data: operation,
    statusCode: 201,
  });
}

/**
 * Update an existing operation and recalculate all descendants
 * Uses transaction to ensure atomic updates
 */
const updateOperation = async (request: Request, response: Response): Promise<void> => {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    GetOperationByIdParams,
    unknown,
    UpdateOperationInput,
    unknown
  >;

  const { params, body, user } = authenticatedRequest;
  const userId = user.id;

  const result = await prisma.$transaction(async (tx) => {
    // 1. Fetch current operation with discussion
    const operation = await tx.operation.findUnique({
      where: { id: params.operationId },
      include: { discussion: true },
    });

    if (!operation) {
      throw new NotFoundError('Operation not found');
    }

    if (operation.createdBy !== userId) {
      throw new ForbiddenError('You do not have permission to update this operation');
    }

    // 2. Check if discussion is ended
    if (operation.discussion.isEnded) {
      throw new BadRequestError('Cannot update operation in ended discussion');
    }

    // 3. Determine new values (use provided or keep existing)
    const newValue = body.value ?? operation.value;
    const newType = body.operationType ?? operation.operationType;

    // 4. Validate division by zero
    if (newType === 'DIVIDE' && newValue === 0) {
      throw new BadRequestError('Cannot divide by zero');
    }

    // 5. Get parent's afterValue (or discussion starting value for root ops)
    const parent = operation.parentId
      ? await tx.operation.findUnique({
          where: { id: operation.parentId },
          select: { afterValue: true },
        })
      : { afterValue: operation.discussion.startingValue };

    if (!parent) {
      throw new NotFoundError('Parent operation not found');
    }

    // 6. Calculate new afterValue for this operation
    const newTypeForCalc = body.operationType || operation.operationType;
    const newValueForCalc = body.value ?? operation.value;
    const newAfterValue = operationService.calculateOperation(
      parent.afterValue,
      newTypeForCalc,
      newValueForCalc
    );

    // 7. Update the operation itself
    const updatedOperation = await tx.operation.update({
      where: { id: params.operationId },
      data: {
        title: body.title,
        operationType: body.operationType,
        value: body.value,
        beforeValue: parent.afterValue,
        afterValue: newAfterValue,
      },
      include: {
        user: {
          select: userSelectBasic,
        },
      },
    });

    // 8. Recalculate all descendants
    const affectedCount = await operationService.recalculateOperationTree(params.operationId, tx);

    // 9. Invalidate root nodes cache
    await cacheService.invalidateRootNodesCache(operation.discussionId);

    return { operation: updatedOperation, affectedCount };
  });

  sendSuccessResponse({
    response,
    message: `Operation updated. ${result.affectedCount} descendant(s) recalculated.`,
    statusCode: 200,
    data: result.operation,
  });
};

async function deleteOperation(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    GetOperationByIdParams,
    unknown,
    unknown,
    unknown
  >;

  const { params, user } = authenticatedRequest;
  const operationId = Number(params.operationId);

  const operation = await prisma.operation.findUnique({
    where: { id: operationId },
    include: { discussion: true },
  });

  if (!operation) {
    throw new NotFoundError('Operation not found');
  }

  if (operation.createdBy !== user.id) {
    throw new ForbiddenError('You do not have permission to delete this operation');
  }

  if (operation.discussion.isEnded) {
    throw new BadRequestError('Cannot delete operation from ended discussion');
  }

  await prisma.operation.delete({
    where: { id: operationId },
  });

  // Invalidate root nodes cache
  await cacheService.invalidateRootNodesCache(operation.discussionId);

  sendSuccessResponse({
    response,
    message: 'Operation deleted successfully',
    data: null,
  });
}

const operationController = {
  createOperation,
  updateOperation,
  deleteOperation,
  getOperationById,
  getOperations,
  getOperationsList,
};

export default operationController;
