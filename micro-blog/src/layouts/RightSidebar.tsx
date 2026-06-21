import React from 'react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import dayjs from 'dayjs';
import { useAppStore } from '../store';
import UserCard from '../components/UserCard';
import Heatmap from '../components/Heatmap';
import TagList from '../components/TagList';
import styles from './RightSidebar.module.css';

const RightSidebar: React.FC = () => {
  const { user, posts, tags } = useAppStore();
  const navigate = useNavigate();

  const heatmapData = useMemo(() => {
    type DateMap = Record<string, number>;
    const dateMap: DateMap = posts.reduce<DateMap>((acc, post) => {
      const date = dayjs(post.createdAt).format('YYYY-MM-DD');
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(dateMap).map(([date, count]) => ({ date, count }));
  }, [posts]);

  const stats = useMemo(() => {
    const uniqueDays = new Set(posts.map((p) => dayjs(p.createdAt).format('YYYY-MM-DD')));
    return { posts: posts.length, tags: tags.length, days: uniqueDays.size };
  }, [posts, tags]);

  const handleTagClick = (tag: string) => {
    navigate(`/search?tag=${encodeURIComponent(tag)}`);
  };

  // 未登录时显示提示
  if (!user) {
    return (
      <>
        <div className={styles.statsCard} style={{ padding: 24, textAlign: 'center' }}>
          <p style={{ color: '#999', fontSize: 14, marginBottom: 16 }}>
            登录后可查看完整内容
          </p>
          <Button type="primary" ghost onClick={() => navigate('/login')}>
            去登录
          </Button>
        </div>

        <div className={styles.statsCard}>
          <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#52c41a' }}>{stats.posts}</div>
              <div style={{ fontSize: 12, color: '#bbb' }}>Memo</div>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#52c41a' }}>{stats.tags}</div>
              <div style={{ fontSize: 12, color: '#bbb' }}>Tags</div>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#52c41a' }}>{stats.days}</div>
              <div style={{ fontSize: 12, color: '#bbb' }}>Days</div>
            </div>
          </div>
        </div>

        <div className={styles.heatmapCard}>
          <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600 }}>发博热力图</h3>
          <Heatmap data={heatmapData} />
        </div>

        <TagList tags={tags} onTagClick={handleTagClick} />
      </>
    );
  }

  return (
    <>
      <UserCard user={user} />

      <div className={styles.statsCard}>
        <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#52c41a' }}>{stats.posts}</div>
            <div style={{ fontSize: 12, color: '#bbb' }}>Memo</div>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#52c41a' }}>{stats.tags}</div>
            <div style={{ fontSize: 12, color: '#bbb' }}>Tags</div>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#52c41a' }}>{stats.days}</div>
            <div style={{ fontSize: 12, color: '#bbb' }}>Days</div>
          </div>
        </div>
      </div>

      <div className={styles.heatmapCard}>
        <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600 }}>发博热力图</h3>
        <Heatmap data={heatmapData} />
      </div>

      <TagList tags={tags} onTagClick={handleTagClick} />
    </>
  );
};

export default RightSidebar;
