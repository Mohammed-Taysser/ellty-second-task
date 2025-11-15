import { Button, Card, InputNumber, Radio, Space, Typography } from "antd";
import { Divide, Minus, Plus, X } from "lucide-react";
import { useState } from "react";

const { Text, Title } = Typography;

interface OperationFormProps {
  currentValue: number;
  onSubmit: (type: OperationType, operand: number) => void;
  onCancel: () => void;
}

const operations = [
  { type: "add" as OperationType, icon: Plus, label: "Add", symbol: "+" },
  { type: "subtract" as OperationType, icon: Minus, label: "Subtract", symbol: "-" },
  { type: "multiply" as OperationType, icon: X, label: "Multiply", symbol: "×" },
  { type: "divide" as OperationType, icon: Divide, label: "Divide", symbol: "÷" },
];

export const OperationForm = ({ currentValue, onSubmit, onCancel }: OperationFormProps) => {
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
        return operand !== 0 ? currentValue / operand : 0;
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
      <Title level={4}>Add New Operation</Title>
      
      <Space direction="vertical"  style={{ width: "100%" }}>
        <div>
          <Text strong style={{ display: "block", marginBottom: 8 }}>Select Operation</Text>
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
          <Text strong style={{ display: "block", marginBottom: 8 }}>Operand</Text>
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
            border: "2px solid #1890ff"
          }}
        >
          <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>Preview</Text>
          <div style={{ fontFamily: "monospace", fontSize: 20 }}>
            <Space>
              <Text strong>{currentValue.toFixed(2)}</Text>
              <Text>{operations.find((op) => op.type === selectedType)?.symbol}</Text>
              <Text strong>{operand.toFixed(2)}</Text>
              <Text>=</Text>
              <Text strong style={{ color: "#1890ff" }}>{calculatePreview().toFixed(2)}</Text>
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
