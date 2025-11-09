import { User } from '@prisma/client';
import { Request } from 'express';

interface AuthenticatedRequest<
  Params = unknown,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = unknown,
> extends Request<Params, ResBody, ReqBody, ReqQuery> {
  user: User;
  parsedQuery: ReqQuery;
}
