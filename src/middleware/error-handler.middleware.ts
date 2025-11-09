import { ErrorRequestHandler } from 'express';

import CONFIG from '@/apps/config';
import { BaseError } from '@/utils/errors.utils';

interface ErrorBody {
  success: boolean;
  error: string;
  stack?: string;
  path?: string;
  method?: string;
}

const errorHandlerMiddleware: ErrorRequestHandler = (
  err,
  request,
  response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next
) => {
  const status = err instanceof BaseError ? err.statusCode : 500;
  let errorContent = 'Internal Server Error';

  if (err instanceof BaseError) {
    try {
      const parsedError = JSON.parse(err.message);

      errorContent = parsedError;
    } catch {
      errorContent = err.message;
    }
  }

  const body: ErrorBody = {
    success: false,
    error: errorContent,
  };

  if (CONFIG.NODE_ENV === 'development') {
    body.stack = err.stack;
    body.path = request.originalUrl;
    body.method = request.method;
  }

  response.status(status).json(body);
};

export default errorHandlerMiddleware;
