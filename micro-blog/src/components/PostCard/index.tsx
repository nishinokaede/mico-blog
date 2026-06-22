import React, { useState, useRef } from 'react';
import { Tag, Dropdown, Modal, message, Image, Space, Select } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  LinkOutlined,
  LockOutlined,
  GlobalOutlined,
  EnvironmentOutlined,
  LaptopOutlined,
  EllipsisOutlined,
  DownloadOutlined,
  LeftOutlined,
  RightOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  SwapOutlined,
  UndoOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  SoundOutlined,
  MutedOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  PushpinOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { Post } from '../../types';
import MarkdownViewer from '../MarkdownViewer';
import styles from './index.module.css';

interface PostCardProps {
  post: Post;
  nickname: string;
  isLoggedIn: boolean;
  showIpDevice: boolean;
  onEdit: (post: Post) => void;
  onDelete: (id: number) => void;
  onTagClick: (tag: string) => void;
  onTogglePin?: (id: number) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, nickname, isLoggedIn, showIpDevice, onEdit, onDelete, onTagClick, onTogglePin }) => {
  const [current, setCurrent] = useState(0);

  // 视频播放器状态
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);

  const handleVideoToggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  };

  const handleMuteToggle = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(!video.muted);
  };

  const handleSpeedChange = (val: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = val;
    setSpeed(val);
  };

  const handleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
      setFullscreen(false);
    } else {
      video.requestFullscreen();
      setFullscreen(true);
    }
  };

  const handleVideoEnded = () => {
    setPlaying(false);
  };

  const handleVideoPlay = () => {
    setPlaying(true);
  };

  const handleVideoPause = () => {
    setPlaying(false);
  };

  const handleDelete = () => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条微博吗？此操作不可撤销。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => onDelete(post.id),
    });
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/?post=${post.id}`);
      message.success('链接已复制到剪贴板');
    } catch {
      message.error('复制失败');
    }
  };

  const onDownload = () => {
    const url = post.images?.[current];
    if (!url) return;
    const suffix = url.slice(url.lastIndexOf('.'));
    const filename = Date.now() + suffix;

    fetch(url)
      .then((response) => response.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(new Blob([blob]));
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        URL.revokeObjectURL(blobUrl);
        link.remove();
      });
  };

  const menuItems = [
    ...(isLoggedIn
      ? [
          {
            key: 'edit',
            label: '编辑',
            icon: <EditOutlined />,
            onClick: () => onEdit(post),
          },
          {
            key: 'delete',
            label: '删除',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: handleDelete,
          },
        ]
      : []),
    {
      key: 'copyLink',
      label: '复制链接',
      icon: <LinkOutlined />,
      onClick: handleCopyLink,
    },
  ];

  const visibilityIcon =
    post.visibility === 'public' ? (
      <GlobalOutlined style={{ color: '#52c41a', fontSize: 12 }} />
    ) : (
      <LockOutlined style={{ color: '#ff4d4f', fontSize: 12 }} />
    );

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.meta}>
          <span className={styles.date}>{dayjs(post.createdAt).format('YYYY-MM-DD HH:mm')}</span>
          <span className={styles.author}>@{nickname}</span>
          <span className={styles.visibility}>
            {visibilityIcon}
            <span className={styles.visibilityText}>
              {post.visibility === 'public' ? '所有人可见' : '仅自己可见'}
            </span>
          </span>
          {showIpDevice && post.ip_address && (
            <span className={styles.deviceItem}>
              <EnvironmentOutlined />
              {post.ip_address}
            </span>
          )}
          {showIpDevice && post.device && (
            <span className={styles.deviceItem}>
              <LaptopOutlined />
              {post.device}
            </span>
          )}
        </div>
        <div className={styles.headerRight}>
          {isLoggedIn && onTogglePin && (
            <span
              className={`${styles.pinBtn} ${post.isPinned ? styles.pinBtnActive : ''}`}
              onClick={() => onTogglePin(post.id)}
              title={post.isPinned ? '取消置顶' : '置顶'}
            >
              <PushpinOutlined />
            </span>
          )}
          <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
            <span className={styles.moreBtn}>
              <EllipsisOutlined />
            </span>
          </Dropdown>
        </div>
      </div>
      <div className={styles.content}>
        <MarkdownViewer content={post.content} />
      </div>
      {post.images && post.images.length > 0 && (
        <div className={styles.images}>
          <Image.PreviewGroup
            preview={{
              onChange: (index) => {
                setCurrent(index);
              },
              actionsRender: (
                _,
                {
                  transform: { scale },
                  actions: {
                    onActive,
                    onFlipY,
                    onFlipX,
                    onRotateLeft,
                    onRotateRight,
                    onZoomOut,
                    onZoomIn,
                    onReset,
                  },
                },
              ) => (
                <Space size={12}>
                  <LeftOutlined
                    disabled={current === 0}
                    onClick={() => onActive?.(-1)}
                  />
                  <RightOutlined
                    disabled={current === (post.images?.length ?? 1) - 1}
                    onClick={() => onActive?.(1)}
                  />
                  <DownloadOutlined onClick={onDownload} />
                  <SwapOutlined rotate={90} onClick={onFlipY} />
                  <SwapOutlined onClick={onFlipX} />
                  <RotateLeftOutlined onClick={onRotateLeft} />
                  <RotateRightOutlined onClick={onRotateRight} />
                  <ZoomOutOutlined disabled={scale === 1} onClick={onZoomOut} />
                  <ZoomInOutlined disabled={scale === 50} onClick={onZoomIn} />
                  <UndoOutlined onClick={onReset} />
                </Space>
              ),
            }}
          >
            {post.images.map((url, index) => (
              <Image
                key={index}
                src={url}
                alt={`post-img-${index}`}
                width={64}
                height={64}
                style={{ objectFit: 'cover', borderRadius: 4, border: '1px solid #f0f0f0' }}
              />
            ))}
          </Image.PreviewGroup>
        </div>
      )}
      {post.video && (
        <div className={styles.videoWrapper}>
          <video
            ref={videoRef}
            src={post.video}
            className={styles.videoEl}
            playsInline
            preload="metadata"
            onEnded={handleVideoEnded}
            onPlay={handleVideoPlay}
            onPause={handleVideoPause}
            onClick={handleVideoToggle}
          />
          {!playing && (
            <div className={styles.videoOverlay} onClick={handleVideoToggle}>
              <PlayCircleOutlined className={styles.playIcon} />
            </div>
          )}
          <div className={styles.videoControls}>
            <span onClick={handleVideoToggle} className={styles.controlBtn}>
              {playing ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            </span>
            <span onClick={handleMuteToggle} className={styles.controlBtn}>
              {muted ? <MutedOutlined /> : <SoundOutlined />}
            </span>
            <Select
              size="small"
              value={speed}
              onChange={handleSpeedChange}
              className={styles.speedSelect}
              popupMatchSelectWidth={false}
              options={[
                { value: 0.5, label: '0.5x' },
                { value: 0.75, label: '0.75x' },
                { value: 1, label: '1x' },
                { value: 1.25, label: '1.25x' },
                { value: 1.5, label: '1.5x' },
                { value: 2, label: '2x' },
              ]}
            />
            <span onClick={handleFullscreen} className={styles.controlBtn}>
              {fullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            </span>
          </div>
        </div>
      )}
      {post.tags.length > 0 && (
        <div className={styles.tags}>
          {post.tags.map((tag) => (
            <Tag
              key={tag}
              color="green"
              className={styles.tag}
              onClick={() => onTagClick(tag)}
            >
              #{tag}
            </Tag>
          ))}
        </div>
      )}
    </div>
  );
};

export default PostCard;
