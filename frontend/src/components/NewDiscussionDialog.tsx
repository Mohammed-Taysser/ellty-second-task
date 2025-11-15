import { Form, Input, InputNumber, message, Modal } from "antd";

interface NewDiscussionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateDiscussion: (data: { title: string, initialValue: number; }) => void;
}

export const NewDiscussionDialog = ({
  isOpen,
  onOpenChange,
  onCreateDiscussion,
}: NewDiscussionDialogProps) => {
  const [form] = Form.useForm();

  const handleOk = () => {
    form.validateFields().then((values) => {
      if (!values.title || values.initialValue === undefined) {
        message.error("Please fill in all fields");
        return;
      }
      onCreateDiscussion(values);
      form.resetFields();
      onOpenChange(false);
    });
  };

  const handleCancel = () => {
    form.resetFields();
    onOpenChange(false);
  };

  return (
    <Modal
      title="Create New Discussion"
      open={isOpen}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="Create Discussion"
      maskClosable={false}
    >
      <Form
        form={form}
        layout="vertical"
        className="mt-3"
      >
        <Form.Item
          label="Discussion Title"
          name="title"
          rules={[{ required: true, message: "Please enter a title" }]}
        >
          <Input
            placeholder="Enter a descriptive title..."

          />
        </Form.Item>

        <Form.Item
          label="Initial Value"
          name="initialValue"
          rules={[{ required: true, message: "Please enter an initial value" }]}
        >
          <InputNumber
            placeholder="Enter starting number..."

            style={{ width: "100%" }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
