import { Request } from 'express';
import { User } from 'prisma/generated';

interface AuthenticatedRequest<
  Params = unknown,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = unknown,
> extends Request<Params, ResBody, ReqBody, ReqQuery> {
  user: User;
  parsedQuery: ReqQuery;
}
