export interface TreeOperation extends Operation {
  children: TreeOperation[];
}

export const buildOperationTree = (operations: Operation[]): TreeOperation[] => {
  const operationMap = new Map<number, TreeOperation>();
  const roots: TreeOperation[] = [];

  // Initialize map
  operations.forEach((op) => {
    operationMap.set(op.id, { ...op, children: [] });
  });

  // Build tree
  operations.forEach((op) => {
    const node = operationMap.get(op.id)!;
    if (op.parentId === null) {
      roots.push(node);
    } else {
      const parent = operationMap.get(op.parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        // Handle orphan: treat as root
        console.warn(`Orphan operation found: ${op.id}, treating as root`);
        roots.push(node);
      }
    }
  });

  return roots;
};
