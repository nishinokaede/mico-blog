import React, { useState, useCallback, useMemo } from 'react';
import { Modal } from 'antd';
import dayjs from 'dayjs';
import { Post, Visibility } from '../../types';
import { useAppStore } from '../../store';
import PostEditor from '../../components/PostEditor';
import PostCard from '../../components/PostCard';
import EmptyState from '../../components/EmptyState';
import styles from './index.module.css';

const HomePage: React.FC = () => {
  const { posts, tags, user, auth, addPost, editPost, removePost } = useAppStore();
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (data: { content: string; visibility: Visibility; tags: string[]; images: string[]; video?: string }) => {
      setLoading(true);
      try {
        await addPost(data);
      } finally {
        setLoading(false);
      }
    },
    [addPost]
  );

  const handleEdit = useCallback((post: Post) => {
    setEditingPost(post);
  }, []);

  const handleEditSubmit = useCallback(
    async (data: { content: string; visibility: Visibility; tags: string[]; images: string[]; video?: string }) => {
      if (!editingPost) return;
      setLoading(true);
      try {
        await editPost(editingPost.id, {
          content: data.content,
          visibility: data.visibility,
          tags: data.tags,
          images: data.images,
          video: data.video,
        });
        setEditingPost(null);
      } finally {
        setLoading(false);
      }
    },
    [editingPost, editPost]
  );

  const handleDelete = useCallback(
    async (id: number) => {
      await removePost(id);
    },
    [removePost]
  );

  const handleTagClick = useCallback((tag: string) => {
    window.location.href = `/search?tag=${encodeURIComponent(tag)}`;
  }, []);

  const stats = useMemo(() => {
    const uniqueDays = new Set(posts.map((p) => dayjs(p.createdAt).format('YYYY-MM-DD')));
    return {
      posts: posts.length,
      tags: tags.length,
      days: uniqueDays.size,
    };
  }, [posts, tags]);

  return (
    <div className={styles.page}>
      <div className={styles.statsBar}>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{stats.posts}</span>
          <span className={styles.statLabel}>Memo</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{stats.tags}</span>
          <span className={styles.statLabel}>Tags</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{stats.days}</span>
          <span className={styles.statLabel}>Days</span>
        </div>
      </div>

      {auth.isLoggedIn ? (
        <PostEditor onSubmit={handleSubmit} loading={loading} />
      ) : (
        <div className={styles.postList}>
          <EmptyState description="登录后可发布微博" />
        </div>
      )}

      {posts.length === 0 ? (
        <EmptyState description="还没有微博，快来记录第一条吧" />
      ) : (
        <div className={styles.postList}>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              nickname={user?.nickname || 'densu'}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onTagClick={handleTagClick}
            />
          ))}
        </div>
      )}

      <Modal
        title="编辑微博"
        open={!!editingPost}
        onCancel={() => setEditingPost(null)}
        footer={null}
        destroyOnHidden
        width={640}
      >
        {editingPost && (
          <PostEditor
            initialPost={editingPost}
            onSubmit={handleEditSubmit}
            loading={loading}
          />
        )}
      </Modal>
    </div>
  );
};

export default HomePage;
