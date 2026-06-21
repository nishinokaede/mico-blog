import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Tabs, Form, Input, Button, Select, Table, message,
  Popconfirm, Upload, Avatar,
} from 'antd';
import { DeleteOutlined, UploadOutlined, UserOutlined } from '@ant-design/icons';
import ImgCrop from 'antd-img-crop';
import type { UploadFile, RcFile } from 'antd/es/upload/interface';
import { useAppStore } from '../../store';
import { User } from '../../types';
import { deleteTag } from '../../api/tag';
import { saveUserProfile } from '../../api/user';
import request from '../../utils/request';
import styles from './index.module.css';

const { TextArea } = Input;

/** 上传流程：获取预签名URL → 直传R2 → 确认上传 */
async function avatarUpload(file: RcFile): Promise<string> {
  // 1. 获取预签名上传URL
  const urlRes = await request.post('/mblog/upload-url', {
    file_name: file.name,
    file_type: file.type,
    upload_type: 'avatar',
  });
  if (urlRes.data.code !== 200) {
    throw new Error(urlRes.data.message || '获取上传地址失败');
  }
  const { upload_url, key, public_url } = urlRes.data.data;

  // 2. 直传 R2
  const putRes = await fetch(upload_url, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
  });
  if (!putRes.ok) {
    throw new Error(`上传文件失败 (${putRes.status})`);
  }

  // 3. 确认上传
  const confirmRes = await request.post('/mblog/confirm-upload', {
    key,
    original_name: file.name,
    upload_type: 'avatar',
  });
  if (confirmRes.data.code !== 200) {
    throw new Error(confirmRes.data.message || '确认上传失败');
  }

  return public_url;
}

const SettingsPage: React.FC = () => {
  const { user, updateUser, tags, refreshTags, refreshPosts, logout } = useAppStore();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>(user?.avatar || '');

  const handleUserSave = async (values: User) => {
    setSaving(true);
    try {
      await saveUserProfile({ ...values, avatar: avatarUrl });
      await updateUser({ ...values, avatar: avatarUrl });
      if (values.password) {
        message.success('密码已修改，请重新登录');
        logout();
        navigate('/login');
      } else {
        message.success('保存成功');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTag = async (name: string) => {
    await deleteTag(name);
    await refreshTags();
    await refreshPosts();
    message.success(`标签 #${name} 已删除`);
  };

  /** 处理头像上传 */
  const handleAvatarChange = async (info: { file: UploadFile }) => {
    if (info.file.status === 'uploading') {
      setUploading(true);
      return;
    }
    if (info.file.status === 'done') {
      const url = info.file.response as string;
      setAvatarUrl(url);
      setUploading(false);
      message.success('头像上传成功');
    }
    if (info.file.status === 'error') {
      setUploading(false);
      message.error(info.file.error?.message || '头像上传失败');
    }
  };

  /** 自定义上传逻辑 */
  const customUpload = async (options: {
    file: RcFile;
    onSuccess: (url: string) => void;
    onError: (err: Error) => void;
  }) => {
    try {
      const url = await avatarUpload(options.file);
      options.onSuccess(url);
    } catch (err) {
      options.onError(err as Error);
    }
  };

  const visibleTags = tags.filter((t) => t.name !== 'undefined' && t.name !== 'null');

  const tagColumns = [
    {
      title: '标签名',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <span style={{ color: '#52c41a' }}>#{name}</span>,
    },
    {
      title: '使用次数',
      dataIndex: 'count',
      key: 'count',
      width: 100,
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: unknown, record: { name: string }) => (
        <Popconfirm
          title="确定删除这个标签吗？"
          description="该标签将从所有微博中移除。"
          onConfirm={() => handleDeleteTag(record.name)}
          okText="删除"
          cancelText="取消"
        >
          <Button type="text" danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      ),
    },
  ];

  const devInfo = (
    <div className={styles.devInfo}>
      <div className={styles.devRow}>
        <span className={styles.devLabel}>项目名称</span>
        <span>Micro Blog</span>
      </div>
      <div className={styles.devRow}>
        <span className={styles.devLabel}>版本</span>
        <span>0.0.1</span>
      </div>
      <div className={styles.devRow}>
        <span className={styles.devLabel}>GitHub</span>
        <a href="https://github.com/nishinokaede" target="_blank" rel="noopener noreferrer">
          nishinokaede
        </a>
      </div>
      <div className={styles.devRow}>
        <span className={styles.devLabel}>Weibo</span>
        <a href="https://weibo.com/u/7858914035" target="_blank" rel="noopener noreferrer">
          densu_
        </a>
      </div>
      <div className={styles.devRow}>
        <span className={styles.devLabel}>构建时间</span>
        <span>{new Date().toLocaleString()}</span>
      </div>
      <div className={styles.devRow}>
        <span className={styles.devLabel}>React</span>
        <span>18.3.1</span>
      </div>
      <div className={styles.devRow}>
        <span className={styles.devLabel}>Vite</span>
        <span>5.4.10</span>
      </div>
    </div>
  );

  const tabItems = [
    {
      key: 'system',
      label: '系统设置',
      children: (
        <div className={styles.tabContent}>
          <div className={styles.placeholder}>功能开发中</div>
        </div>
      ),
    },
    {
      key: 'user',
      label: '用户设置',
      children: (
        <div className={styles.tabContent}>
          <Form
            layout="vertical"
            initialValues={user || {}}
            onFinish={handleUserSave}
            className={styles.form}
          >
            {/* 头像上传 */}
            <Form.Item label="头像" name="avatar">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Avatar
                  size={64}
                  src={avatarUrl || undefined}
                  icon={!avatarUrl ? <UserOutlined /> : undefined}
                />
                <ImgCrop
                  rotationSlider
                  aspect={1}
                  quality={0.9}
                  modalTitle="裁剪头像"
                >
                  <Upload
                    name="avatar"
                    accept="image/*"
                    showUploadList={false}
                    customRequest={customUpload as never}
                    onChange={handleAvatarChange}
                  >
                    <Button
                      icon={<UploadOutlined />}
                      loading={uploading}
                    >
                      {uploading ? '上传中' : '上传头像'}
                    </Button>
                  </Upload>
                </ImgCrop>
              </div>
            </Form.Item>

            <Form.Item
              label="昵称"
              name="nickname"
              rules={[{ required: true, message: '请输入昵称' }]}
            >
              <Input placeholder="densu" />
            </Form.Item>

            <Form.Item label="密码" name="password">
              <Input.Password placeholder="留空就是不修改密码" />
            </Form.Item>

            <Form.Item label="邮箱" name="email">
              <Input placeholder="请输入邮箱" />
            </Form.Item>

            <Form.Item label="个人简介" name="bio">
              <TextArea rows={3} placeholder="介绍一下自己" style={{ height: 150 }} />
            </Form.Item>

            <Form.Item label="默认可见性" name="defaultVisibility">
              <Select
                options={[
                  { value: 'public', label: '所有人可见' },
                  { value: 'private', label: '仅自己可见' },
                ]}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={saving}
                className={styles.saveBtn}
              >
                保存
              </Button>
            </Form.Item>
          </Form>
        </div>
      ),
    },
    {
      key: 'tags',
      label: '标签管理',
      children: (
        <div className={styles.tabContent}>
          <Table
            columns={tagColumns}
            dataSource={visibleTags}
            rowKey="name"
            pagination={{ pageSize: 10, size: 'small' }}
            size="small"
          />
        </div>
      ),
    },
    {
      key: 'dev',
      label: '开发者',
      children: <div className={styles.tabContent}>{devInfo}</div>,
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Tabs items={tabItems} />
      </div>
    </div>
  );
};

export default SettingsPage;
