import discussionApi from '@/api/discussion.api';
import operationApi from '@/api/operation.api';
import { SITEMAP } from '@/apps/config';
import OperationForm from '@/components/OperationForm';
import AuthContext from '@/context/auth.context';
import useApiMessage from '@/hooks/useApiMessage';
import { Button, Card, Col, Empty, Modal, Row, Skeleton, Space, Timeline, Typography } from 'antd';
import dayjs from 'dayjs';
import { ArrowLeft, Calculator, Clock, MessageSquare, Plus, User } from 'lucide-react';
import { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

const { Title, Text } = Typography;

const DiscussionDetail = () => {
  const { discussionId } = useParams();

  const { displayErrorMessages } = useApiMessage();

  const authContext = useContext(AuthContext);

  const [showOperationForm, setShowOperationForm] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<number | null>();

  const [isLoading, setIsLoading] = useState(true);
  const [fetchedDiscussion, setFetchedDiscussion] = useState<Maybe<Discussion>>();

  useEffect(() => {
    if (discussionId && !Number.isNaN(Number(discussionId))) {
      fetchDiscussionByID(Number(discussionId));
    }
  }, [discussionId]);

  const fetchDiscussionByID = async (discussionId: number) => {
    setIsLoading(true);

    try {
      const response = await discussionApi.getById(discussionId);
      setFetchedDiscussion(response.data.data);
    } catch (error) {
      displayErrorMessages(error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentValue = useMemo(() => {
    if (!fetchedDiscussion) {
      return 0;
    }

    if (!fetchedDiscussion.operations || fetchedDiscussion.operations.length === 0) {
      return fetchedDiscussion.startingValue;
    }

    // Find the latest leaf operation (one with no children)
    const leafOperations = fetchedDiscussion.operations.filter(
      (op) => !fetchedDiscussion.operations.some((child) => child.parentId === op.id)
    );

    // If we have leaf operations, return the maximum afterValue among them
    // (representing the latest state in any branch)
    if (leafOperations.length > 0) {
      const afterValues = leafOperations.map((op) => op.afterValue || 0);
      return Math.max(...afterValues);
    }

    return fetchedDiscussion.startingValue;
  }, [fetchedDiscussion]);

  const handleAddRootOperation = () => {
    if (!fetchedDiscussion) return;

    setSelectedParentId(null); // null indicates root operation
    setShowOperationForm(true);
  };

  const handleOperationSubmit = async (type: OperationType, operand: number) => {
    if (!fetchedDiscussion) return;

    try {
      await operationApi.create({
        operation: type,
        value: operand,
        parentId: selectedParentId,
        discussionId: fetchedDiscussion.id,
      });

      setShowOperationForm(false);
      fetchDiscussionByID(fetchedDiscussion.id);
    } catch (error) {
      displayErrorMessages(error);
    }
  };

  const getOperationSymbol = (type: OperationType) => {
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

  const getOperationColor = (type: OperationType) => {
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f5' }}>
      <Modal
        open={showOperationForm}
        onCancel={() => setShowOperationForm(false)}
        footer={null}
        destroyOnClose
      >
        <OperationForm
          currentValue={
            selectedParentId === null
              ? fetchedDiscussion?.startingValue || 0
              : fetchedDiscussion?.operations.find((op) => op.id === selectedParentId)?.afterValue || 0
          }
          onSubmit={handleOperationSubmit}
          onCancel={() => setShowOperationForm(false)}
        />
      </Modal>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link to={SITEMAP.homepage.path}>
            <Button icon={<ArrowLeft className="h-4 w-4" />} className="mb-4" type="text">
              Back to Discussions
            </Button>
          </Link>

          {isLoading && (
            <Card>
              <Skeleton active />
            </Card>
          )}

          {!fetchedDiscussion && !isLoading && (
            <Card>
              <div className="text-center py-16">
                <Empty
                  image={
                    <MessageSquare className="h-16 w-16 mx-auto" style={{ color: '#d9d9d9' }} />
                  }
                  description={
                    <Space direction="vertical" size="small">
                      <Typography.Title level={3}>No discussion found</Typography.Title>
                      <Typography.Text type="secondary">
                        The discussion you are looking for is not found
                      </Typography.Text>
                    </Space>
                  }
                />
              </div>
            </Card>
          )}

          {!isLoading && fetchedDiscussion && (
            <>
              <Row justify="space-between" className="mb-4" align="middle">
                <Col>
                  <Title level={1} style={{ marginBottom: 8 }}>
                    {fetchedDiscussion.title}
                  </Title>

                  <Space>
                    <Space>
                      <Calculator className="h-4 w-4" />
                      <Text strong className="text-xl font-mono">
                        Initial: {fetchedDiscussion.startingValue.toFixed(2)}
                      </Text>
                    </Space>

                    <Text type="secondary">•</Text>
                    <Text
                      strong
                      className={`font-mono text-xl ${currentValue > fetchedDiscussion.startingValue
                        ? '!text-green-500'
                        : currentValue < fetchedDiscussion.startingValue
                          ? '!text-red-500'
                          : '!text-gray-500'
                        }`}
                    >
                      Current: {currentValue.toFixed(2)}
                    </Text>
                  </Space>
                </Col>

                <Col>
                  <Button
                    type="primary"
                    size="large"
                    onClick={handleAddRootOperation}
                    icon={<Plus className="h-5 w-5" />}
                  >
                    Add Root Operation
                  </Button>
                </Col>
              </Row>

              <Card className="md:!p-4">
                {fetchedDiscussion.operations.length === 0 ? (
                  <div className="text-center py-16">
                    <Empty
                      image={
                        <Calculator className="h-12 w-12 mx-auto" style={{ color: '#d9d9d9' }} />
                      }
                      description={
                        <Space direction="vertical" size="small">
                          <Title level={4}>No operations yet</Title>
                          <Text type="secondary">
                            Add your first operation to start building the tree
                          </Text>
                        </Space>
                      }
                    >
                      <Button
                        type="primary"
                        size="large"
                        icon={<Plus className="h-5 w-5" />}
                        onClick={handleAddRootOperation}
                      >
                        Add Root Operation
                      </Button>
                    </Empty>
                  </div>
                ) : (
                  <Timeline
                    items={fetchedDiscussion.operations.map((operation) => {
                      const color = getOperationColor(operation.operationType);
                      const symbol = getOperationSymbol(operation.operationType);

                      return {
                        key: operation.id,
                        dot: (
                          <div
                            className="text-white text-2xl flex justify-center relative items-center w-8 h-8 rounded-full"
                            style={{ backgroundColor: color }}
                          >
                            <span className="absolute top-[-3px]">{symbol}</span>
                          </div>
                        ),
                        children: (
                          <Card size="small">
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
                                      {operation.user.id === authContext.user?.id
                                        ? 'You'
                                        : operation.user.name}
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
                                // onClick={() => onAddOperation(operation.id)}
                                >
                                  Add Operation
                                </Button>
                              </Col>
                            </Row>
                          </Card>
                        ),
                      };
                    })}
                  />
                )}
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiscussionDetail;
