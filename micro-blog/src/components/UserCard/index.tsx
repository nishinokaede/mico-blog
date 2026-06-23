import React from 'react';
import { Avatar } from 'antd';
import { LinkOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { User } from '../../types';
import styles from './index.module.css';

interface UserCardProps {
  user: User;
}

const UserCard: React.FC<UserCardProps> = ({ user }) => {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <Avatar
          src={user.avatar || undefined}
          size={64}
          className={styles.avatar}
        >
          {user.nickname.charAt(0).toUpperCase()}
        </Avatar>
        <div className={styles.nameRow}>
          <span className={styles.nickname}>@{user.nickname}</span>
          <a
            href="/rss"
            className={styles.rssLink}
            title="RSS 订阅"
            onClick={(e) => {
              e.preventDefault();
            }}
          >
            <LinkOutlined />
          </a>
        </div>
      </div>
      <div className={styles.info}>
        <div className={styles.joinDate}>
          加入于 {user.createdAt ? dayjs(user.createdAt).format('YYYY-MM-DD') : '—'}
        </div>
        {user.bio && <div className={styles.bio}>{user.bio}</div>}
      </div>
    </div>
  );
};

export default UserCard;
