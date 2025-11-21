import { NextFunction, Request, Response } from 'express';

import prisma from '@/apps/prisma';
import tokenService from '@/services/token.service';
import { AuthenticatedRequest } from '@/types/import';
import { NotFoundError, UnauthorizedError } from '@/utils/errors.utils';

async function authenticateMiddleware(req: Request, _res: Response, next: NextFunction) {
  try {
    const request = req as AuthenticatedRequest;
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedError('Missing Authorization header');
    }

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Invalid Authorization format');
    }

    const token = authHeader.split(' ')[1].trim();

    const decodedUser = tokenService.verifyToken(token);

    if (!decodedUser) {
      throw new UnauthorizedError('Missing or invalid token');
    }

    if (typeof decodedUser === 'string') {
      throw new UnauthorizedError('Invalid or incomplete token');
    }

    const user = await prisma.user.findUnique({
      where: { id: decodedUser.id },
      include: {
        discussions: true,
        operations: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    request.user = user;

    return next();
  } catch (error) {
    return next(error);
  }
}

export default authenticateMiddleware;
