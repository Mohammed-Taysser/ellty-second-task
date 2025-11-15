import { App, Button, Card, Form, Input, Space, Typography,   } from "antd";
import { MessageSquare } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

 
function LoginPage() {
  const navigateTo = useNavigate();

  const app = App.useApp();

  const [loading, setLoading] = useState(false);

  const onFinish = (values: { email: string; password: string; }) => {
    setLoading(true);

    console.log(values);
    

    setTimeout(() => {
      app.message.success("Welcome back!, mohammed");
      setLoading(false);
      navigateTo("/");
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#f5f5f5]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Space>
            <MessageSquare className="h-8 w-8 text-aurora" />
            <span className="text-2xl font-bold">Discussion Trees</span>
          </Space>
        </div>

        <Card>
          <Typography.Title level={3} className="!mb-0">Welcome back</Typography.Title>
          <Typography.Title level={5} className="!mt-1" type="secondary">Sign in to your account to continue</Typography.Title>

          <Form
            layout="vertical"
            onFinish={onFinish}
            className="!mt-4"
            size="large"
          >
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, },
                { type: "email", }
              ]}
            >
              <Input placeholder="you@example.com" />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, }]}
            >
              <Input.Password placeholder="••••••••" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>
                Sign In
              </Button>
            </Form.Item>
          </Form>

          <div className="text-center mt-4">
            <Typography.Text type="secondary">
              Don't have an account?{" "}
              <Link to="/register"  >
                Sign up
              </Link>
            </Typography.Text>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default LoginPage;
