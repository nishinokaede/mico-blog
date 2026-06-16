import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { login } from '../../api/user';
import { useAppStore } from '../../store';
import styles from './index.module.css';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login: doContextLogin } = useAppStore();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const result = await login(values.username, values.password);
      // 更新 Context 中的 auth 状态，触发 useEffect 重新加载数据
      doContextLogin(result.token, result.user?.nickname || result.user?.username);
      message.success('登录成功');
      navigate('/', { replace: true });
    } catch (err) {
      message.error(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Micro Blog</h1>
        <p className={styles.subtitle}>个人微博 · 登录</p>
        <Form
          onFinish={handleSubmit}
          size="large"
          style={{ marginTop: 32 }}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#bbb' }} />}
              placeholder="用户名"
              autoFocus
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#bbb' }} />}
              placeholder="密码"
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
            >
              登录
            </Button>
          </Form.Item>
        </Form>
        <div className={styles.hint}>
          <a href="/" style={{ color: '#999' }}>← 返回首页（仅查看公开内容）</a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
