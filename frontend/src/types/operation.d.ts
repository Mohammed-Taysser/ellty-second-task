type OperationType = 'ADD' | 'SUBTRACT' | 'MULTIPLY' | 'DIVIDE';

interface Operation extends BaseEntity {
  discussionId: number;
  parentId: number | null;
  title?: string;
  operationType: OperationType;
  value: number;
  beforeValue: number;
  afterValue: number;
  user: User;
}

interface CreateOperationPayload {
  operation: OperationType;
  value: number;
  parentId?: number | null;
  discussionId?: number;
}

interface UpdateOperationPayload extends CreateOperationPayload {
  id: number;
}
