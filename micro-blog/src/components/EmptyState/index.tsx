import React from 'react';
import { Empty } from 'antd';
import styles from './index.module.css';

interface EmptyStateProps {
  description: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ description }) => {
  return (
    <div className={styles.container}>
      <Empty description={description} />
    </div>
  );
};

export default EmptyState;
