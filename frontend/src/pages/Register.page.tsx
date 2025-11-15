import { App, Button, Card, Form, Input, Space, Typography,   } from "antd";
import { MessageSquare } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

 
function RegisterPage() {
  const navigate = useNavigate();
  const app = App.useApp()
  
  const [loading, setLoading] = useState(false);

  const onFinish = (values: { name: string; email: string; password: string; confirmPassword: string; }) => {
    if (values.password !== values.confirmPassword) {
      app.message.error("Passwords don't match");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      app.message.success("Welcome to Discussion Trees!");
      setLoading(false);
      navigate("/");
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
          <Typography.Title level={3}>Create an account</Typography.Title>
          <Typography.Title level={5} className="!mb-0 !mt-2" type="secondary">Start exploring mathematical discussions</Typography.Title>

          <Form
            layout="vertical"
            onFinish={onFinish}
            className="!mt-3"
            size="large"
          >
            <Form.Item
              label="Name"
              name="name"
              rules={[{ required: true, }]}
            >
              <Input placeholder="John Doe" />
            </Form.Item>

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
              rules={[
                { required: true, },
                { min: 8, }
              ]}
            >
              <Input.Password placeholder="••••••••" />
            </Form.Item>

            <Form.Item
              label="Confirm Password"
              name="confirmPassword"
              dependencies={['password']}
        rules={[
          {
            required: true,
          },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('The new password that you entered do not match!'));
            },
          }),
        ]}
            >
              <Input.Password placeholder="••••••••" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>
                Create Account
              </Button>
            </Form.Item>
          </Form>

          <div className="text-center mt-4" >
            <Typography.Text type="secondary">
              Already have an account?{" "}
              <Link to="/login">
                Sign in
              </Link>
            </Typography.Text>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default RegisterPage;
