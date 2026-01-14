import { Router } from 'express';

import controller from './auth.controller';
import validator from './auth.validator';

import authenticateMiddleware from '@/middleware/authenticate.middleware';
import validateRequest from '@/middleware/validate-request.middleware';

const authRoutes = Router();

authRoutes.post('/register', validateRequest(validator.registerSchema), controller.register);
authRoutes.post('/login', validateRequest(validator.loginSchema), controller.login);
authRoutes.post(
  '/refresh-token',
  validateRequest(validator.refreshTokenSchema),
  controller.refreshToken
);

authRoutes.post(
  '/switch-user',
  authenticateMiddleware,
  validateRequest(validator.switchUserSchema),
  controller.switchUser
);

export default authRoutes;
