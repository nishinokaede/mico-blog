import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Modal, Spin, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Post, Visibility } from '../../types';
import { useAppStore } from '../../store';
import { getPostById } from '../../api/post';
import PostEditor from '../../components/PostEditor';
import PostCard from '../../components/PostCard';
import EmptyState from '../../components/EmptyState';
import styles from './index.module.css';

const HomePage: React.FC = () => {
  const { posts, tags, user, auth, siteConfig, loadingMore, hasMore, addPost, editPost, removePost, loadMorePosts, togglePin } = useAppStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const postIdParam = searchParams.get('post');
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(false);
  const [sharedPost, setSharedPost] = useState<Post | null>(null);
  const [sharedLoading, setSharedLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

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

  // 通过分享链接 ?post=xx 访问时，加载指定帖子
  useEffect(() => {
    if (!postIdParam) return;
    const id = parseInt(postIdParam, 10);
    if (isNaN(id)) return;
    setSharedLoading(true);
    getPostById(id)
      .then((post) => {
        setSharedPost(post || null);
      })
      .catch(() => {
        setSharedPost(null);
      })
      .finally(() => setSharedLoading(false));
  }, [postIdParam]);

  const stats = useMemo(() => {
    const uniqueDays = new Set(posts.map((p) => dayjs(p.createdAt).format('YYYY-MM-DD')));
    return {
      posts: posts.length,
      tags: tags.length,
      days: uniqueDays.size,
    };
  }, [posts, tags]);

  // 无限滚动：监听底部哨兵元素，自动加载下一页
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMorePosts();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMorePosts]);

  // 分享链接查看单条帖子
  if (postIdParam) {
    if (sharedLoading) {
      return (
        <div className={styles.page}>
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Spin size="large" />
          </div>
        </div>
      );
    }

    if (!sharedPost) {
      return (
        <div className={styles.page}>
          <EmptyState description="帖子不存在或已被删除" />
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/', { replace: true })}
            >
              回到首页
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.page}>
        <div className={styles.sharedHeader}>
          <Button
            type="link"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/', { replace: true })}
            style={{ padding: 0 }}
          >
            回到首页
          </Button>
        </div>
        <PostCard
          post={sharedPost}
          nickname={user?.nickname || 'densu'}
          isLoggedIn={auth.isLoggedIn}
          showIpDevice={siteConfig.show_ip_device}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onTagClick={handleTagClick}
          onTogglePin={togglePin}
        />
      </div>
    );
  }

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
              isLoggedIn={auth.isLoggedIn}
              showIpDevice={siteConfig.show_ip_device}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onTagClick={handleTagClick}
              onTogglePin={togglePin}
            />
          ))}
          <div ref={sentinelRef} className={styles.sentinel}>
            {loadingMore && <Spin size="small" />}
          </div>
          {!hasMore && (
            <div className={styles.endMessage}>已经到底啦！</div>
          )}
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
