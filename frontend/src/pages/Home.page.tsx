import { Button, Empty, Space, Typography } from "antd";
import { LogIn, MessageSquare, Plus } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DiscussionCard from "../components/DiscussionCard";
import { NewDiscussionDialog } from "../components/NewDiscussionDialog";

 function HomePage() {
  const navigate = useNavigate();

  const [discussions, setDiscussions] = useState<Discussion[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

      const handleCreateDiscussion = (data:{title: string, initialValue: number}) => {
    // const newDiscussion = createDiscussion(title, initialValue);
    // navigate(`/discussion/${newDiscussion.id}`);
  };

  return (
 <div className="min-h-screen" style={{ backgroundColor: "#f5f5f5" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Space align="center">
              <MessageSquare className="h-10 w-10" style={{ color: "#1890ff" }} />
              <Typography.Title level={1} style={{ margin: 0 }}>Discussion Trees</Typography.Title>
            </Space>
            <Typography.Text type="secondary" style={{ display: "block", marginTop: 8 }}>
              Create and explore mathematical operation discussions
            </Typography.Text>
          </div>
          <Space>
            <Link to="/login">
              <Button  icon={<LogIn className="h-5 w-5" />}>
                Sign In
              </Button>
            </Link>
            <Button
              type="primary"
              
              onClick={() => setIsDialogOpen(true)}
              icon={<Plus className="h-5 w-5" />}
            >
              New Discussion
            </Button>
          </Space>
        </div>

        {/* Empty State */}
        {discussions.length === 0 ? (
          <div className="text-center py-16">
            <Empty
              image={<MessageSquare className="h-16 w-16 mx-auto" style={{ color: "#d9d9d9" }} />}
              description={
                <Space direction="vertical" size="small">
                  <Typography.Title level={3}>No discussions yet</Typography.Title>
                  <Typography.Text type="secondary">
                    Create your first discussion to start exploring mathematical operations
                  </Typography.Text>
                </Space>
              }
            >
              <Button
                type="primary"
                
                onClick={() => setIsDialogOpen(true)}
                icon={<Plus className="h-5 w-5" />}
              >
                Create First Discussion
              </Button>
            </Empty>
          </div>
        ) : (
          /* Discussion Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {discussions.map((discussion) => (
              <DiscussionCard key={discussion.id} discussion={discussion} />
            ))}
          </div>
        )}
      </div>

      <NewDiscussionDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onCreateDiscussion={handleCreateDiscussion}
      />
    </div>
  );
}

export default HomePage