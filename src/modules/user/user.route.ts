import { Router } from 'express';

import controller from './user.controller';
import validator from './user.validator';

import authenticateMiddleware from '@/middleware/authenticate.middleware';
import validateRequest from '@/middleware/validate-request.middleware';

const userRouter = Router();

userRouter.patch(
  '/me',
  validateRequest(validator.updateMeSchema),
  authenticateMiddleware,
  controller.updateMe
);
userRouter.get('/me', authenticateMiddleware, controller.getProfile);

userRouter.get('/list', validateRequest(validator.getUsersListSchema), controller.getUsersList);
userRouter.get('/', validateRequest(validator.getUsersListSchema), controller.getUsers);

userRouter.get('/:userId', validateRequest(validator.getUserByIdSchema), controller.getUserById);

userRouter.post(
  '/',
  authenticateMiddleware,
  validateRequest(validator.createUserSchema),
  controller.createUser
);

userRouter.patch(
  '/:userId',
  authenticateMiddleware,
  validateRequest(validator.updateUserSchema),
  controller.updateUser
);
userRouter.delete('/:userId', authenticateMiddleware, controller.deleteUser);

export default userRouter;
