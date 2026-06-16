import React from 'react';
import { Tag } from '../../types';
import styles from './index.module.css';

interface TagListProps {
  tags: Tag[];
  onTagClick: (tag: string) => void;
}

const TagList: React.FC<TagListProps> = ({ tags, onTagClick }) => {
  const top10 = tags.slice(0, 10);

  if (top10.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>热门标签</h3>
      <div className={styles.list}>
        {top10.map((tag) => (
          <div
            key={tag.name}
            className={styles.tagItem}
            onClick={() => onTagClick(tag.name)}
          >
            <span className={styles.tagName}>#{tag.name}</span>
            <span className={styles.tagCount}>({tag.count})</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TagList;
