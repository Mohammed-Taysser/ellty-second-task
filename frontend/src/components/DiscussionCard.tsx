import { Card, Space, Typography } from "antd";
import dayjs from "dayjs";
import { Calculator, Clock } from "lucide-react";
import { Link } from "react-router-dom";

interface DiscussionCardProps {
  discussion: Discussion;
}

function DiscussionCard({ discussion }: DiscussionCardProps) {
  return (
    <Link to={`/discussion/${discussion.id}`}>
      <Card
        hoverable
        style={{
          height: "100%",
          transition: "all 0.3s ease",
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Typography.Title level={4} style={{ marginBottom: 8 }}>{discussion.title}</Typography.Title>
            <Space >
              <Space size="small">
                <Calculator className="w-4 h-4" style={{ color: "#1890ff" }} />
                <Typography.Text strong style={{ fontFamily: "monospace" }}>
                  {discussion.currentValue.toFixed(2)}
                </Typography.Text>
              </Space>
              <Space size="small">
                <Clock className="w-4 h-4" />
                <Typography.Text type="secondary">
                  Updated {dayjs(discussion.updatedAt).fromNow()}
                </Typography.Text>
              </Space>
            </Space>
          </div>
          <div className="text-right">
            <Typography.Text type="secondary" style={{ display: "block", fontSize: 12 }}>Operations</Typography.Text>
            <Typography.Text strong style={{ fontSize: 24, color: "#1890ff" }}>{discussion.operations.length}</Typography.Text>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export default DiscussionCard;
