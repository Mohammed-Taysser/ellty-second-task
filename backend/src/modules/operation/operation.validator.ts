import { OPERATION_TYPE } from 'prisma/generated';
import { z } from 'zod';

import { zodParseEnumList } from '@/utils/zod-utils';
import { basePaginationSchema } from '@/validations/base.validation';

const getOperationsListSchema = {
  query: basePaginationSchema.extend({
    operationType: zodParseEnumList<OPERATION_TYPE>(Object.values(OPERATION_TYPE)).optional(),
  }),
};

const getOperationByIdSchema = {
  params: z.object({
    operationId: z.coerce.number().positive().int(),
  }),
};

const createOperationSchema = {
  body: z.object({
    operation: z.enum(OPERATION_TYPE),
    value: z.coerce.number(),
    parentId: z.coerce.number().positive().int(),
  }),
};

type CreateOperationInput = z.infer<typeof createOperationSchema.body>;
type GetOperationsListQuery = z.infer<typeof getOperationsListSchema.query>;
type GetOperationByIdParams = z.infer<typeof getOperationByIdSchema.params>;

const operationValidator = {
  createOperationSchema,
  getOperationsListSchema,
  getOperationByIdSchema,
};

export type { CreateOperationInput, GetOperationByIdParams, GetOperationsListQuery };

export default operationValidator;
