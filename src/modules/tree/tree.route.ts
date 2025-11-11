import { Router } from 'express';

import controller from './tree.controller';
import validator from './tree.validator';

import authenticateMiddleware from '@/middleware/authenticate.middleware';
import validateRequest from '@/middleware/validate-request.middleware';

const treeRouter = Router();

treeRouter.get('/list', validateRequest(validator.getTreesListSchema), controller.getTreesList);
treeRouter.get('/', validateRequest(validator.getTreesListSchema), controller.getTrees);

treeRouter.get('/:treeId', validateRequest(validator.getTreeByIdSchema), controller.getTreeById);

treeRouter.post(
  '/',
  authenticateMiddleware,
  validateRequest(validator.createTreeSchema),
  controller.createTree
);

treeRouter.patch(
  '/:treeId',
  authenticateMiddleware,
  validateRequest(validator.updateTreeSchema),
  controller.updateTree
);
treeRouter.delete('/:treeId', authenticateMiddleware, controller.deleteTree);

export default treeRouter;
