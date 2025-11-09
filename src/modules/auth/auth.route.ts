import { Router } from 'express';

import controller from './auth.controller';
import validator from './auth.validator';

import validateRequest from '@/middleware/validate-request.middleware';

const router = Router();

router.post('/register', validateRequest(validator.registerSchema), controller.register);
router.post('/login', validateRequest(validator.loginSchema), controller.login);
router.post(
  '/refresh-token',
  validateRequest(validator.refreshTokenSchema),
  controller.refreshToken
);

export default router;
