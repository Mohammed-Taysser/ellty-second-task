import OperationCard from '@/components/OperationCard';
import { getOperationColor, getOperationSymbol } from '@/utils/operation.utils';
import type { TreeOperation } from '@/utils/tree.utils';
import { Timeline } from 'antd';

interface DiscussionTreeProps {
  operations: TreeOperation[];
  onAddChild: (id: number) => void;
  isEnded?: boolean;
}

const DiscussionTree = ({ operations, onAddChild, isEnded }: DiscussionTreeProps) => {
  if (!operations || operations.length === 0) {
    return null;
  }

  return (
    <Timeline
      mode="left"
      items={operations.map((operation) => {
        const symbol = getOperationSymbol(operation.operationType);
        const color = getOperationColor(operation.operationType);

        return {
          dot: (
            <div
              className="text-white text-2xl flex justify-center relative items-center w-8 h-8 rounded-full"
              style={{ backgroundColor: color }}
            >
              <span className="absolute top-[-3px]">{symbol}</span>
            </div>
          ),
          children: (
            <div className="mb-4">
              <OperationCard
                operation={operation}
                onAddChild={onAddChild}
                disabledAdd={isEnded}
              />
              {operation.children.length > 0 && (
                <div className="mt-4">
                  <DiscussionTree
                    operations={operation.children}
                    onAddChild={onAddChild}
                  />
                </div>
              )}
            </div>
          ),
        };
      })}
    />
  );
};

export default DiscussionTree;
