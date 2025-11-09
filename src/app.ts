import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import qs from 'qs';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

import CONFIG from '@/apps/config';
import errorHandlerMiddleware from '@/middleware/error-handler.middleware';
import { ForbiddenError, NotFoundError } from '@/utils/errors.utils';

const app = express();

if (CONFIG.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Load swagger document with absolute path
const swaggerDocument = YAML.load('./docs/swagger.yaml');
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Make sure the body is parsed beforehand.
app.use(hpp());

// secure apps by setting various HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// enable CORS - Cross Origin Resource Sharing
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || CONFIG.ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new ForbiddenError(`CORS: Origin ${origin} is not allowed`));
      }
    },
  })
);

// parse body params and attache them to req.body
app.use(express.urlencoded({ extended: true, limit: '30mb' }));
app.use(express.json({ limit: '30mb' }));

// Parse query strings using qs library
app.set('query parser', (str: string) => qs.parse(str));

// Routes
app.use('/', (_request, response) => {
  response.json({ message: 'hello world' });
});

// 404 Handler
app.use((req, _res, next) => {
  next(new NotFoundError('Resource Not Found'));
});

// Global Error Handler (last)
app.use(errorHandlerMiddleware);

app.listen(CONFIG.PORT, () => {
  console.debug(`🚀 Server running on port ${CONFIG.PORT}`);
});

export default app;
