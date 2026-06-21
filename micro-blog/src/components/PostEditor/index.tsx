import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Input, Select, Button, Popover, message } from 'antd';
import {
  PictureOutlined,
  VideoCameraOutlined,
  SmileOutlined,
  FileTextOutlined,
  CloseOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { Post, Visibility } from '../../types';
import request from '../../utils/request';
import EmojiPicker from '../EmojiPicker';
import styles from './index.module.css';

const { TextArea } = Input;

interface PostEditorProps {
  onSubmit: (data: { content: string; visibility: Visibility; tags: string[]; images: string[]; video?: string }) => Promise<void>;
  initialPost?: Post;
  loading?: boolean;
}

function extractTags(content: string): string[] {
  const regex = /#(\w+)/g;
  const matches = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    matches.add(match[1]);
  }
  return Array.from(matches);
}

/** 上传文件到 R2（图片或视频，与头像上传相同流程） */
async function uploadFile(file: File): Promise<string> {
  // 1. 获取预签名上传URL
  const urlRes = await request.post('/mblog/upload-url', {
    file_name: file.name,
    file_type: file.type,
    upload_type: 'post',
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
    upload_type: 'post',
  });
  if (confirmRes.data.code !== 200) {
    throw new Error(confirmRes.data.message || '确认上传失败');
  }

  return public_url;
}

const PostEditor: React.FC<PostEditorProps> = ({ onSubmit, initialPost, loading }) => {
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [images, setImages] = useState<string[]>([]);
  const [video, setVideo] = useState<string | undefined>(undefined);
  const [uploading, setUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialPost) {
      setContent(initialPost.content);
      setVisibility(initialPost.visibility);
      setImages(initialPost.images || []);
      setVideo(initialPost.video);
    }
  }, [initialPost]);

  const handleSubmit = useCallback(async () => {
    const trimmed = content.trim();
    if (!trimmed) {
      message.warning('请输入内容');
      return;
    }
    const tags = extractTags(trimmed);
    await onSubmit({ content: trimmed, visibility, tags, images, video });
    if (!initialPost) {
      setContent('');
      setVisibility('public');
      setImages([]);
      setVideo(undefined);
    }
  }, [content, visibility, images, video, onSubmit, initialPost]);

  const handleEmojiSelect = useCallback((emoji: string) => {
    setEmojiOpen(false);
    const textarea = textAreaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.slice(0, start) + emoji + content.slice(end);
      setContent(newContent);
      // 恢复光标位置到插入的 emoji 之后
      requestAnimationFrame(() => {
        const pos = start + emoji.length;
        textarea.selectionStart = pos;
        textarea.selectionEnd = pos;
        textarea.focus();
      });
    } else {
      setContent((prev) => prev + emoji);
    }
  }, [content]);

//   const handlePlaceholder = () => {
//     message.info('功能开发中');
//   };

  const handleSelectImages = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileList.length === 0) {
      message.warning('请选择图片文件');
      return;
    }

    setUploading(true);
    const newUrls: string[] = [];
    for (const file of fileList) {
      try {
        const url = await uploadFile(file);
        newUrls.push(url);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '上传失败';
        message.error(`${file.name}: ${msg}`);
      }
    }

    if (newUrls.length > 0) {
      setImages((prev) => [...prev, ...newUrls]);
    }
    setUploading(false);

    // 清空 input 以支持重复选同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSelectVideo = () => {
    if (video) {
      message.warning('一次只能上传一个视频');
      return;
    }
    videoInputRef.current?.click();
  };

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('video/')) {
      message.warning('请选择视频文件');
      return;
    }

    setVideoUploading(true);
    try {
      const url = await uploadFile(file);
      setVideo(url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '上传失败';
      message.error(`${file.name}: ${msg}`);
    }
    setVideoUploading(false);

    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  };

  const handleRemoveVideo = () => {
    setVideo(undefined);
  };

  return (
    <div className={styles.editor}>
      <TextArea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="输入你要记录的内容，第一行以 # 开头会被视为标题"
        className={styles.textarea}
        autoSize={{ minRows: 4, maxRows: 10 }}
        ref={(ref: any) => {
          if (ref?.resizableTextArea?.textArea) {
            (textAreaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = ref.resizableTextArea.textArea;
          } else {
            (textAreaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = null;
          }
        }}
      />

      {/* 图片预览区域 */}
      {images.length > 0 && (
        <div className={styles.imagePreview}>
          {images.map((url, index) => (
            <div key={index} className={styles.imageItem}>
              <img src={url} alt={`upload-${index}`} />
              <span
                className={styles.imageRemove}
                onClick={() => handleRemoveImage(index)}
              >
                <CloseOutlined />
              </span>
            </div>
          ))}
          {uploading && (
            <div className={styles.imageItem}>
              <div className={styles.uploadingPlaceholder}>
                <LoadingOutlined style={{ fontSize: 24, color: '#999' }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 视频预览区域 */}
      {video && (
        <div className={styles.videoPreview}>
          <video src={video} controls className={styles.videoPlayer} />
          <span className={styles.videoRemove} onClick={handleRemoveVideo}>
            <CloseOutlined />
          </span>
        </div>
      )}
      {videoUploading && (
        <div className={styles.videoPreview}>
          <div className={styles.videoUploading}>
            <LoadingOutlined style={{ fontSize: 32, color: '#999' }} />
            <span>视频上传中...</span>
          </div>
        </div>
      )}

      <div className={styles.toolbar}>
        <div className={styles.leftActions}>
          <Select
            value={visibility}
            onChange={(val) => setVisibility(val)}
            className={styles.visibilitySelect}
            size="small"
            options={[
              { value: 'public', label: '所有人可见' },
              { value: 'private', label: '仅自己可见' },
            ]}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            style={{ display: 'none' }}
            onChange={handleVideoChange}
          />
          <Button
            size="small"
            icon={<PictureOutlined />}
            onClick={handleSelectImages}
            loading={uploading}
            title="上传图片"
          />
          <Button
            size="small"
            icon={<VideoCameraOutlined />}
            onClick={handleSelectVideo}
            loading={videoUploading}
            title="上传视频（仅一个）"
          />
          <Popover
            content={<EmojiPicker onSelect={handleEmojiSelect} />}
            title="表情"
            trigger="click"
            open={emojiOpen}
            onOpenChange={setEmojiOpen}
            destroyTooltipOnHide
          >
            <Button
              size="small"
              icon={<SmileOutlined />}
              title="添加表情"
            />
          </Popover>
          {/* <Button
            size="small"
            icon={<FullscreenOutlined />}
            onClick={handlePlaceholder}
            title="全屏"
          /> */}
        </div>
        <Button
          type="primary"
          icon={<FileTextOutlined />}
          onClick={handleSubmit}
          loading={loading}
          className={styles.submitBtn}
        >
          记录
        </Button>
      </div>
    </div>
  );
};

export default PostEditor;
