export const getOperationSymbol = (type: OperationType) => {
  switch (type) {
    case 'ADD':
      return '+';
    case 'SUBTRACT':
      return '−';
    case 'MULTIPLY':
      return '×';
    case 'DIVIDE':
      return '÷';
  }
};

export const getOperationColor = (type: OperationType) => {
  switch (type) {
    case 'ADD':
      return '#52c41a';
    case 'SUBTRACT':
      return '#f5222d';
    case 'MULTIPLY':
      return '#1890ff';
    case 'DIVIDE':
      return '#fa8c16';
  }
};
