import { Prisma } from '@prisma';
import { Request, Response } from 'express';

import {
  CreateUserInput,
  GetUserByIdParams,
  GetUsersListQuery,
  UpdateMeInput,
  UpdateUserInput,
} from './user.validator';

import prisma from '@/apps/prisma';
import tokenService from '@/services/token.service';
import { AuthenticatedRequest } from '@/types/import';
import { buildDateRangeFilter } from '@/utils/dayjs.utils';
import { ConflictError, ForbiddenError, NotFoundError } from '@/utils/errors.utils';
import { userSelectFull } from '@/utils/prisma-selects.utils';
import { sendPaginatedResponse, sendSuccessResponse } from '@/utils/response.utils';

async function getUsers(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    unknown,
    unknown,
    unknown,
    GetUsersListQuery
  >;

  const query = authenticatedRequest.parsedQuery;

  const skip = (query.page - 1) * query.limit;

  const filters: Prisma.UserWhereInput = {};

  if (query.name) {
    filters.name = {
      contains: query.name,
    };
  }

  if (query.email) {
    filters.email = {
      contains: query.email,
    };
  }

  if (query.createdAt) {
    filters.createdAt = buildDateRangeFilter(query.createdAt);
  }

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: query.limit,
      orderBy: { createdAt: 'desc' },
      where: filters,
      select: userSelectFull,
    }),
    prisma.user.count({
      where: filters,
    }),
  ]);

  sendPaginatedResponse({
    response,
    message: 'All users',
    data,
    metadata: {
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    },
  });
}

async function getUsersList(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    unknown,
    unknown,
    unknown,
    GetUsersListQuery
  >;

  const query = authenticatedRequest.parsedQuery;

  const filters: Prisma.UserWhereInput = {};

  if (query.name) {
    filters.name = {
      contains: query.name,
    };
  }

  if (query.email) {
    filters.email = {
      contains: query.email,
    };
  }

  const users = await prisma.user.findMany({
    select: userSelectFull,
    where: filters,
  });

  sendSuccessResponse({ response, message: 'Users list', data: users });
}

async function getUserById(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    GetUserByIdParams,
    unknown,
    unknown,
    unknown
  >;

  const { params } = authenticatedRequest;

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: userSelectFull,
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  sendSuccessResponse({
    response,
    message: 'User found',
    data: user,
  });
}

async function getProfile(request: Request, response: Response) {
  const authenticatedRequest = request as AuthenticatedRequest;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...user } = authenticatedRequest.user;

  sendSuccessResponse({
    response,
    message: 'Current user',
    data: user,
  });
}

async function createUser(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    unknown,
    unknown,
    CreateUserInput,
    unknown
  >;

  const { body } = authenticatedRequest;

  const user = await prisma.user.findUnique({
    where: { email: body.email },
  });

  if (user) {
    throw new ConflictError('Email already registered');
  }

  const hashed = await tokenService.hash(body.password);

  const newUser = await prisma.user.create({
    data: {
      ...body,
      password: hashed,
    },
    select: userSelectFull,
  });

  sendSuccessResponse({
    response,
    message: 'User created',
    data: newUser,
    statusCode: 201,
  });
}

async function updateUser(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    GetUserByIdParams,
    unknown,
    UpdateUserInput,
    unknown
  >;

  const { body, params, user: authUser } = authenticatedRequest;

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (params.userId !== authUser.id) {
    throw new ForbiddenError('You do not have permission to update this user');
  }

  const updatedUser = await prisma.user.update({
    where: { id: params.userId },
    data: {
      ...body,
    },
    select: userSelectFull,
  });

  sendSuccessResponse({
    response,
    message: 'User updated',
    data: updatedUser,
  });
}

async function updateMe(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    unknown,
    unknown,
    UpdateMeInput
  >;
  const user = authenticatedRequest.user;

  if (authenticatedRequest.body.email) {
    const existingUser = await prisma.user.findUnique({
      where: { email: authenticatedRequest.body.email },
    });

    if (existingUser && existingUser.id !== user.id) {
      throw new ConflictError('Email already registered');
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...authenticatedRequest.body,
    },
    select: userSelectFull,
  });

  sendSuccessResponse({
    response,
    message: 'User profile updated',
    data: updatedUser,
  });
}

async function deleteUser(request: Request, response: Response) {
  const authenticatedRequest = request as unknown as AuthenticatedRequest<
    GetUserByIdParams,
    unknown,
    unknown,
    unknown
  >;

  const { params, user } = authenticatedRequest;

  const userRecord = await prisma.user.findUnique({
    where: { id: params.userId },
  });

  if (!userRecord) {
    throw new NotFoundError('User not found');
  }

  if (params.userId !== user.id) {
    throw new ForbiddenError('You do not have permission to delete this user');
  }

  const deletedUser = await prisma.user.delete({
    where: { id: params.userId },
    select: userSelectFull,
  });

  sendSuccessResponse({
    response,
    message: 'User deleted',
    data: deletedUser,
  });
}

const userController = {
  createUser,
  deleteUser,
  getProfile,
  getUserById,
  getUsers,
  getUsersList,
  updateMe,
  updateUser,
};

export default userController;
