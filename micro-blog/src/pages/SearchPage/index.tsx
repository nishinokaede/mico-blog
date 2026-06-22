import React, { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Select, Input, DatePicker, Button, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Post, SearchParams, Visibility } from '../../types';
import { useAppStore } from '../../store';
import PostCard from '../../components/PostCard';
import EmptyState from '../../components/EmptyState';
import { searchPosts, togglePinPost } from '../../api/post';
import styles from './index.module.css';

const { RangePicker } = DatePicker;

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { tags, user, auth, siteConfig } = useAppStore();
  const [results, setResults] = useState<Post[]>([]);
  const [searched, setSearched] = useState(false);

  // filter state
  const [tag, setTag] = useState<string | undefined>(searchParams.get('tag') || undefined);
  const [visibility, setVisibility] = useState<Visibility | 'all'>('all');
  const [content, setContent] = useState('');
  const [dateRange, setDateRange] = useState<[string, string] | null>([
    dayjs().subtract(3, 'year').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD'),
  ]);

  // sync tag from URL
  useEffect(() => {
    const urlTag = searchParams.get('tag');
    if (urlTag) {
      setTag(urlTag);
    }
  }, [searchParams]);

  const handleSearch = useCallback(async () => {
    const params: SearchParams = {
      tag,
      visibility,
      content: content || undefined,
      dateRange,
    };
    const data = await searchPosts(params);
    setResults(data);
    setSearched(true);

    // update URL
    const sp = new URLSearchParams();
    if (tag) sp.set('tag', tag);
    setSearchParams(sp, { replace: true });
  }, [tag, visibility, content, dateRange, setSearchParams]);

  const handleTogglePin = useCallback(async (id: number) => {
    try {
      const updated = await togglePinPost(id);
      setResults((prev) => {
        const others = prev.filter((p) => p.id !== id);
        const all = [updated, ...others];
        const pinned = all.filter((p) => p.isPinned).sort(
          (a, b) => new Date(b.pinnedAt || '').getTime() - new Date(a.pinnedAt || '').getTime()
        );
        const unpinned = all.filter((p) => !p.isPinned);
        return [...pinned, ...unpinned];
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '置顶操作失败';
      message.error(msg);
    }
  }, []);

  const handleTagClick = useCallback(
    (clickedTag: string) => {
      setTag(clickedTag);
      const sp = new URLSearchParams();
      sp.set('tag', clickedTag);
      setSearchParams(sp, { replace: true });
    },
    [setSearchParams]
  );

  const tagOptions = [
    { value: '', label: '全部' },
    ...tags.map((t) => ({ value: t.name, label: `#${t.name} (${t.count})` })),
  ];

  return (
    <div className={styles.page}>
      <div className={styles.filterBar}>
        <Select
          value={tag || ''}
          onChange={(val) => setTag(val || undefined)}
          options={tagOptions}
          placeholder="选择标签"
          style={{ width: 160 }}
          allowClear
        />

        <Select
          value={visibility}
          onChange={(val) => setVisibility(val)}
          options={[
            { value: 'all', label: '全部' },
            { value: 'public', label: '所有人可见' },
            { value: 'private', label: '仅自己可见' },
          ]}
          style={{ width: 140 }}
        />

        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="搜索内容"
          style={{ width: 180 }}
          allowClear
          onPressEnter={handleSearch}
        />

        <RangePicker
          value={
            dateRange
              ? [dayjs(dateRange[0]), dayjs(dateRange[1])]
              : null
          }
          onChange={(dates) => {
            if (dates && dates[0] && dates[1]) {
              setDateRange([
                dates[0].format('YYYY-MM-DD'),
                dates[1].format('YYYY-MM-DD'),
              ]);
            } else {
              setDateRange(null);
            }
          }}
          style={{ width: 240 }}
        />

        <Button
          type="primary"
          icon={<SearchOutlined />}
          onClick={handleSearch}
          className={styles.searchBtn}
        >
          搜索
        </Button>
      </div>

      {searched && results.length === 0 ? (
        <EmptyState description="没有找到匹配的微博" />
      ) : (
        <div className={styles.results}>
          {results.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              nickname={user?.nickname || 'densu'}
              isLoggedIn={auth.isLoggedIn}
              showIpDevice={siteConfig.show_ip_device}
              onEdit={() => {}}
              onDelete={() => {}}
              onTagClick={handleTagClick}
              onTogglePin={handleTogglePin}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchPage;
