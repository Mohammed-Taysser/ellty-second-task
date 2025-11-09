import { Request, Response } from 'express';

import { LoginInput, RefreshTokenInput, RegisterInput } from './auth.validator';

import prisma from '@/apps/prisma';
import tokenService from '@/services/token.service';
import { BadRequestError, ConflictError, UnauthorizedError } from '@/utils/errors.utils';
import { sendSuccessResponse } from '@/utils/response.utils';

async function register(request: Request<unknown, unknown, RegisterInput>, response: Response) {
  const data = request.body;

  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (user) {
    throw new ConflictError('Email already registered');
  }

  const hashed = await tokenService.hash(data.password);

  const newUser = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashed,
    },
  });

  const payload = { id: newUser.id, email: newUser.email };

  const accessToken = tokenService.signAccessToken(payload);
  const refreshToken = tokenService.signRefreshToken(payload);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...restUser } = newUser;

  sendSuccessResponse({
    response,
    message: 'User registered',
    data: { accessToken, refreshToken, user: restUser },
    statusCode: 201,
  });
}

async function login(request: Request<unknown, unknown, LoginInput>, response: Response) {
  const data = request.body;

  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new BadRequestError('Invalid credentials');
  }

  const valid = await tokenService.compare(data.password, user.password);

  if (!valid) {
    throw new BadRequestError('Invalid credentials');
  }

  const payload = { id: user.id, email: user.email };

  const accessToken = tokenService.signAccessToken(payload);
  const refreshToken = tokenService.signRefreshToken(payload);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...restUser } = user;

  sendSuccessResponse({
    response,
    message: 'Login successful',
    data: { accessToken, refreshToken, user: restUser },
  });
}

function refreshToken(request: Request<unknown, unknown, RefreshTokenInput>, response: Response) {
  const { refreshToken } = request.body;

  try {
    const payload = tokenService.verifyToken<UserTokenPayload>(refreshToken);

    const newAccessToken = tokenService.signAccessToken(payload);
    const newRefreshToken = tokenService.signRefreshToken(payload);

    sendSuccessResponse({
      response,
      message: 'New access token issued',
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch {
    throw new UnauthorizedError('Invalid Or Expired Refresh Token');
  }
}

const authController = {
  login,
  refreshToken,
  register,
};

export default authController;
