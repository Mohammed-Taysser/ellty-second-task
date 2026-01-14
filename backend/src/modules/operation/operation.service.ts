import { OPERATION_TYPE, Operation, Prisma } from '@prisma';

import { BadRequestError, NotFoundError } from '@/utils/errors.utils';

/**
 * Calculate the result of an operation
 */
function calculateOperation(
  beforeValue: number,
  operationType: OPERATION_TYPE,
  value: number
): number {
  switch (operationType) {
    case OPERATION_TYPE.ADD:
      return beforeValue + value;
    case OPERATION_TYPE.SUBTRACT:
      return beforeValue - value;
    case OPERATION_TYPE.MULTIPLY:
      return beforeValue * value;
    case 'DIVIDE':
      if (value === 0) {
        throw new BadRequestError('Cannot divide by zero');
      }
      return beforeValue / value;
    default:
      throw new BadRequestError(`Invalid operation type: ${operationType}`);
  }
}

/**
 * Recursively fetch all descendant operations of a given operation
 */
async function getDescendantOperations(
  operationId: number,
  tx: Prisma.TransactionClient
): Promise<Operation[]> {
  const children = await tx.operation.findMany({
    where: { parentId: operationId },
  });

  const descendants: Operation[] = [...children];

  for (const child of children) {
    const childDescendants = await getDescendantOperations(child.id, tx);
    descendants.push(...childDescendants);
  }

  return descendants;
}

/**
 * Topological sort operations by depth (breadth-first)
 * Ensures parents are processed before children
 */
function topologicalSort(operations: Operation[]): Operation[] {
  if (operations.length === 0) return [];

  // Build adjacency map
  const childrenMap = new Map<number, Operation[]>();
  const operationMap = new Map<number, Operation>();

  for (const op of operations) {
    operationMap.set(op.id, op);
    if (op.parentId) {
      if (!childrenMap.has(op.parentId)) {
        childrenMap.set(op.parentId, []);
      }
      childrenMap.get(op.parentId)!.push(op);
    }
  }

  // BFS traversal
  const sorted: Operation[] = [];
  const queue: Operation[] = [];

  // Find root operations (those whose parent is not in the operations list)
  for (const op of operations) {
    if (op.parentId && !operationMap.has(op.parentId)) {
      queue.push(op);
    }
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(current);

    const children = childrenMap.get(current.id) || [];
    queue.push(...children);
  }

  return sorted;
}

/**
 * Recalculate the entire tree of descendants for a given operation
 * This is called after an operation is updated to cascade changes
 *
 * @param operationId - The ID of the operation that was updated
 * @param tx - Prisma transaction client
 * @returns Number of operations recalculated
 */
export async function recalculateOperationTree(
  operationId: number,
  tx: Prisma.TransactionClient
): Promise<number> {
  // 1. Fetch all descendants
  const descendants = await getDescendantOperations(operationId, tx);

  if (descendants.length === 0) {
    return 0; // No descendants to update
  }

  // 2. Sort by depth (parents before children)
  const sorted = topologicalSort(descendants);

  const parentIds = new Set<number>();
  for (const op of sorted) {
    if (op.parentId) {
      parentIds.add(op.parentId);
    }
  }

  const parents = parentIds.size
    ? await tx.operation.findMany({
        where: { id: { in: Array.from(parentIds) } },
        select: { id: true, afterValue: true, depth: true },
      })
    : [];

  const parentValues = new Map<number, { afterValue: number; depth: number }>();
  for (const parent of parents) {
    parentValues.set(parent.id, { afterValue: parent.afterValue, depth: parent.depth });
  }

  // 3. Update each operation
  for (const op of sorted) {
    const parent = parentValues.get(op.parentId!);

    if (!parent) {
      throw new NotFoundError(`Parent operation ${op.parentId} not found`);
    }

    const newAfterValue = calculateOperation(parent.afterValue, op.operationType, op.value);
    const newDepth = parent.depth + 1;

    await tx.operation.update({
      where: { id: op.id },
      data: {
        beforeValue: parent.afterValue,
        afterValue: newAfterValue,
        depth: newDepth,
      },
    });

    parentValues.set(op.id, { afterValue: newAfterValue, depth: newDepth });
  }

  return descendants.length;
}

/**
 * Export helper function for use in controllers
 */
export { calculateOperation };

const operationService = {
  recalculateOperationTree,
  calculateOperation,
  getDescendantOperations,
};

export default operationService;
