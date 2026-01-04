import { Router } from 'express';

import controller from './user.controller';
import validator from './user.validator';

import authenticateMiddleware from '@/middleware/authenticate.middleware';
import validateRequest from '@/middleware/validate-request.middleware';

const userRoutes = Router();

userRoutes.patch(
  '/me',
  authenticateMiddleware,
  validateRequest(validator.updateMeSchema),
  controller.updateMe
);
userRoutes.get('/me', authenticateMiddleware, controller.getProfile);

userRoutes.get(
  '/all',
  authenticateMiddleware,
  validateRequest(validator.getUsersListSchema),
  controller.getUsersList
);
userRoutes.get('/', validateRequest(validator.getUsersListSchema), controller.getUsers);

userRoutes.get('/:userId', validateRequest(validator.getUserByIdSchema), controller.getUserById);

userRoutes.post(
  '/',
  authenticateMiddleware,
  validateRequest(validator.createUserSchema),
  controller.createUser
);

userRoutes.patch(
  '/:userId',
  authenticateMiddleware,
  validateRequest(validator.updateUserSchema),
  controller.updateUser
);
userRoutes.delete(
  '/:userId',
  authenticateMiddleware,
  validateRequest(validator.getUserByIdSchema),
  controller.deleteUser
);

export default userRoutes;
