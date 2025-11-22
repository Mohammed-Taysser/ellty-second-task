import { NextFunction, Request, Response } from 'express';
import prisma from '@/apps/prisma';
import tokenService from '@/services/token.service';
import { AuthenticatedRequest } from '@/types/import';
import { UnauthorizedError } from '@/utils/errors.utils';

async function authenticateMiddleware(req: Request, _res: Response, next: NextFunction) {
  try {
    const request = req as AuthenticatedRequest;
    const authHeader = request.headers.authorization;

    // Missing header
    if (!authHeader) {
      return next(new UnauthorizedError('Authorization header missing'));
    }

    // Must start with "Bearer "
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return next(new UnauthorizedError('Invalid Authorization format'));
    }

    let decoded;
    try {
      decoded = tokenService.verifyToken(token.trim());
    } catch {
      return next(new UnauthorizedError('Invalid or expired token'));
    }

    // Defensive guard
    if (!decoded || typeof decoded !== 'object' || !decoded.id) {
      return next(new UnauthorizedError('Invalid token payload'));
    }

    // Fetch only required user details (minimal)
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        discussions: true,
        operations: true,
      },
    });

    if (!user) {
      return next(new UnauthorizedError('User not found'));
    }

    request.user = user;
    return next();
  } catch (err) {
    return next(err);
  }
}

export default authenticateMiddleware;
