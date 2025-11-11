import { z } from 'zod';

import { basePaginationSchema } from '@/validations/base.validation';

const getTreesListSchema = {
  query: basePaginationSchema.extend({
    title: z.string().trim().min(3).max(100).optional(),
  }),
};

const getTreeByIdSchema = {
  params: z.object({
    treeId: z.coerce.number().min(1).max(100),
  }),
};

const createTreeSchema = {
  body: z.object({
    title: z.string().trim().min(3).max(100),
    startingNumber: z.coerce.number().min(0).max(100),
  }),
};

const updateTreeSchema = {
  body: z.object({
    title: z.string().trim().min(5).max(100).optional(),
  }),
};

type CreateTreeInput = z.infer<typeof createTreeSchema.body>;
type UpdateTreeInput = z.infer<typeof updateTreeSchema.body>;
type GetTreesListQuery = z.infer<typeof getTreesListSchema.query>;
type GetTreeByIdParams = z.infer<typeof getTreeByIdSchema.params>;

const treeValidator = {
  createTreeSchema,
  updateTreeSchema,
  getTreesListSchema,
  getTreeByIdSchema,
};

export type { CreateTreeInput, GetTreeByIdParams, GetTreesListQuery, UpdateTreeInput };

export default treeValidator;
