import AuthContext from '@/context/auth.context';
import { getOperationColor, getOperationSymbol } from '@/utils/operation.utils';
import type { TreeOperation } from '@/utils/tree.utils';
import { Button, Card, Col, Row, Space, Typography } from 'antd';
import dayjs from 'dayjs';
import { Clock, Plus, User } from 'lucide-react';
import { useContext } from 'react';

const { Text } = Typography;

interface OperationCardProps {
  operation: TreeOperation;
  onAddChild: (id: number) => void;
}

const OperationCard = ({ operation, onAddChild }: OperationCardProps) => {
  const authContext = useContext(AuthContext);
  const symbol = getOperationSymbol(operation.operationType);
  const color = getOperationColor(operation.operationType);

  return (
    <Card size="small" className="mb-2">
      <Row justify="space-between" align="middle" gutter={[16, 16]}>
        <Col>
          <div>
            <Space>
              <span
                className="text-lg font-semibold font-mono"
                style={{
                  color,
                }}
              >
                {symbol} {operation.value}
              </span>

              <span className="text-sm text-gray-500">=</span>

              <span className="text-lg font-bold font-mono text-gray-900">
                {operation.afterValue.toFixed(2)}
              </span>
            </Space>
          </div>

          <Space align="center" className="text-gray-500">
            <Space align="center">
              <User className="h-4 w-4" />
              <span>
                {operation.user.id === authContext.user?.id ? 'You' : operation.user.name}
              </span>
            </Space>

            <Text type="secondary">•</Text>

            <Space align="center">
              <Clock className="h-4 w-4" />
              <span>{dayjs(operation.updatedAt).fromNow()}</span>
            </Space>
          </Space>
        </Col>

        <Col>
          <Button
            type="dashed"
            size="large"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => onAddChild(operation.id)}
          >
            Add Operation
          </Button>
        </Col>
      </Row>
    </Card>
  );
};

export default OperationCard;
