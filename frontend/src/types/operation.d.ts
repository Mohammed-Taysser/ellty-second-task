type OperationType = "START" | "END" | "ADD" | "SUBTRACT" | "MULTIPLY" | "DIVIDE";

interface Operation extends BaseEntity{
  treeId: number;
  parentId: number;
  operation: OperationType;
  totals: number;
  value: number;
  user: User;
}