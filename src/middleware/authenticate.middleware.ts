import { NextFunction, Request, Response } from 'express';

import prisma from '@/apps/prisma';
import tokenService from '@/services/token.service';
import { AuthenticatedRequest } from '@/types/import';
import { UnauthorizedError } from '@/utils/errors.utils';

async function authenticateMiddleware(req: Request, _res: Response, next: NextFunction) {
  const request = req as AuthenticatedRequest;
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('errors:missing-or-invalid-authorization-header');
  }

  const token = authHeader.split(' ')[1];

  const decodedUser = tokenService.verifyToken(token);

  if (!decodedUser) {
    throw new UnauthorizedError('errors:missing-or-invalid-token');
  }

  if (typeof decodedUser === 'string') {
    throw new UnauthorizedError('errors:invalid-token');
  }

  const user = await prisma.user.findUnique({
    where: { id: decodedUser.id },
  });

  if (!user) {
    throw new UnauthorizedError('errors:resource-not-found');
  }

  request.user = user;
  next();
}

export default authenticateMiddleware;
