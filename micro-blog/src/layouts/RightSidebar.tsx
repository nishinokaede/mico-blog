import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { useAppStore } from '../store';
import UserCard from '../components/UserCard';
import Heatmap from '../components/Heatmap';
import TagList from '../components/TagList';
import styles from './RightSidebar.module.css';

const RightSidebar: React.FC = () => {
  const { user, stats, tags } = useAppStore();
  const navigate = useNavigate();

  const handleTagClick = (tag: string) => {
    navigate(`/search?tag=${encodeURIComponent(tag)}`);
  };

  const handleHeatmapCellClick = (date: string) => {
    navigate(`/search?date=${encodeURIComponent(date)}`);
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
              <div style={{ fontSize: 18, fontWeight: 700, color: '#52c41a' }}>{stats.memoCount}</div>
              <div style={{ fontSize: 12, color: '#bbb' }}>Memo</div>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#52c41a' }}>{stats.tagCount}</div>
              <div style={{ fontSize: 12, color: '#bbb' }}>Tags</div>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#52c41a' }}>{stats.dayCount}</div>
              <div style={{ fontSize: 12, color: '#bbb' }}>Days</div>
            </div>
          </div>
        </div>

        <div className={styles.heatmapCard}>
          <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600 }}>发博热力图</h3>
          <Heatmap data={stats.heatmap} onCellClick={handleHeatmapCellClick} />
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
            <div style={{ fontSize: 18, fontWeight: 700, color: '#52c41a' }}>{stats.memoCount}</div>
            <div style={{ fontSize: 12, color: '#bbb' }}>Memo</div>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#52c41a' }}>{stats.tagCount}</div>
            <div style={{ fontSize: 12, color: '#bbb' }}>Tags</div>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#52c41a' }}>{stats.dayCount}</div>
            <div style={{ fontSize: 12, color: '#bbb' }}>Days</div>
          </div>
        </div>
      </div>

      <div className={styles.heatmapCard}>
        <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600 }}>发博热力图</h3>
        <Heatmap data={stats.heatmap} onCellClick={handleHeatmapCellClick} />
      </div>

      <TagList tags={tags} onTagClick={handleTagClick} />
    </>
  );
};

export default RightSidebar;
