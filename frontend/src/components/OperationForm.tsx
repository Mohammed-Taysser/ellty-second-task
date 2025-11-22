import { Button, Card, InputNumber, Radio, Space, Typography } from "antd";
import { Divide, Minus, Plus, X } from "lucide-react";
import { useState } from "react";


interface OperationFormProps {
  currentValue: number;
  onSubmit: (type: OperationType, operand: number) => void;
  onCancel: () => void;
}

const operations = [
  { type: "ADD", icon: Plus, label: "Add", symbol: "+" },
  { type: "SUBTRACT", icon: Minus, label: "Subtract", symbol: "-" },
  { type: "MULTIPLY", icon: X, label: "Multiply", symbol: "×" },
  { type: "DIVIDE", icon: Divide, label: "Divide", symbol: "÷" },
];

const OperationForm = ({ currentValue, onSubmit, onCancel }: OperationFormProps) => {
  const [selectedType, setSelectedType] = useState<OperationType>("ADD");
  const [operand, setOperand] = useState<number>(0);

  const calculatePreview = () => {
    switch (selectedType) {
      case "ADD":
        return currentValue + operand;
      case "SUBTRACT":
        return currentValue - operand;
      case "MULTIPLY":
        return currentValue * operand;
      case "DIVIDE":
        return operand === 0 ? 0 : currentValue / operand;
      default:
        return currentValue;
    }
  };

  const handleSubmit = () => {
    if (operand === 0 && selectedType === "DIVIDE") {
      return;
    }
    onSubmit(selectedType, operand);
  };

  return (
    <Card style={{ marginTop: 16 }}>
      <Typography.Title level={4}>Add New Operation</Typography.Title>

      <Space direction="vertical" style={{ width: "100%" }}>
        <div>
          <Typography.Text strong style={{ display: "block", marginBottom: 8 }}>Select Operation</Typography.Text>
          <Radio.Group
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}

          >
            {operations.map((op) => {
              const Icon = op.icon;
              return (
                <Radio.Button key={op.type} value={op.type}>
                  <Space>
                    <Icon className="w-4 h-4" />
                    <span>{op.label}</span>
                  </Space>
                </Radio.Button>
              );
            })}
          </Radio.Group>
        </div>

        <div>
          <Typography.Text strong style={{ display: "block", marginBottom: 8 }}>Operand</Typography.Text>
          <InputNumber
            value={operand}
            onChange={(value) => setOperand(value || 0)}
            placeholder="Enter number..."

            style={{ width: "100%" }}
          />
        </div>

        <Card
          style={{
            backgroundColor: "#f5f5f5",
            border: "2px solid #08b52e"
          }}
        >
          <Typography.Text type="secondary" style={{ display: "block", marginBottom: 8 }}>Preview</Typography.Text>
          <div style={{ fontFamily: "monospace", fontSize: 20 }}>
            <Space>
              <Typography.Text strong>{currentValue.toFixed(2)}</Typography.Text>
              <Typography.Text>{operations.find((op) => op.type === selectedType)?.symbol}</Typography.Text>
              <Typography.Text strong>{operand.toFixed(2)}</Typography.Text>
              <Typography.Text>=</Typography.Text>
              <Typography.Text strong style={{ color: "#08b52e" }}>{calculatePreview().toFixed(2)}</Typography.Text>
            </Space>
          </div>
        </Card>

        <Space style={{ width: "100%", justifyContent: "flex-end" }}>
          <Button onClick={onCancel}>Cancel</Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            disabled={selectedType === "DIVIDE" && operand === 0}
          >
            Add Operation
          </Button>
        </Space>
      </Space>
    </Card>
  );
};

export default OperationForm;
