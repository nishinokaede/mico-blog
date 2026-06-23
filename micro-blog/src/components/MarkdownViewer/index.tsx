import React, { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Popover, Spin } from 'antd';
import dayjs from 'dayjs';
import { Post } from '../../types';
import { getPostById } from '../../api/post';
import styles from './index.module.css';

interface MarkdownViewerProps {
  content: string;
}

/** 提取 /?post=xxx 链接中的帖子 ID */
function extractPostId(href: string): number | null {
  const match = href?.match(/\/\?post=(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/** 帖子链接悬浮预览组件 */
const PostLinkPreview: React.FC<{ postId: number; children: React.ReactNode }> = ({
  postId,
  children,
}) => {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open && !fetched) {
        setFetched(true);
        setLoading(true);
        getPostById(postId)
          .then((data) => setPost(data ?? null))
          .catch(() => setPost(null))
          .finally(() => setLoading(false));
      }
    },
    [postId, fetched],
  );

  const previewContent = loading ? (
    <div style={{ textAlign: 'center', padding: '12px 0' }}>
      <Spin size="small" />
    </div>
  ) : post ? (
    <div className={styles.linkPreview}>
      <div className={styles.linkPreviewMeta}>
        <span>{dayjs(post.createdAt).format('YYYY-MM-DD HH:mm')}</span>
        {post.visibility === 'private' && <span className={styles.linkPreviewPrivate}>私密</span>}
      </div>
      <div className={styles.linkPreviewContent}>
        <MarkdownViewer content={post.content} />
      </div>
    </div>
  ) : (
    <span style={{ color: '#999', fontSize: 12 }}>帖子不存在</span>
  );

  return (
    <Popover
      content={previewContent}
      trigger="hover"
      placement="rightTop"
      mouseEnterDelay={0.3}
      overlayStyle={{ maxWidth: 420 }}
      onOpenChange={handleOpenChange}
    >
      <a href={`/?post=${postId}`} className={styles.postLink}>
        {children}
      </a>
    </Popover>
  );
};

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content }) => {
  return (
    <div className={styles.viewer}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a({ href, children, ...props }) {
            const postId = href ? extractPostId(href) : null;
            if (postId) {
              return <PostLinkPreview postId={postId}>{children}</PostLinkPreview>;
            }
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownViewer;
