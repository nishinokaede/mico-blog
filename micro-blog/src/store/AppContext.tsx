import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Post, User, Tag, AuthState, SiteConfig } from '../types';
import { getPosts, createPost, updatePost, deletePost, togglePinPost } from '../api/post';
import { getTags } from '../api/tag';
import { getUser, isLoggedIn as checkLogin, getAuthToken, logout as doLogout, getSiteConfig } from '../api/user';

interface AppContextType {
  user: User | null;
  posts: Post[];
  tags: Tag[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  auth: AuthState;
  siteConfig: SiteConfig;
  refreshPosts: () => Promise<void>;
  loadMorePosts: () => Promise<void>;
  refreshTags: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshSiteConfig: () => Promise<void>;
  addPost: (post: Omit<Post, 'id' | 'createdAt' | 'views' | 'isPinned' | 'pinnedAt'>) => Promise<Post>;
  editPost: (id: number, data: Partial<Post>) => Promise<void>;
  removePost: (id: number) => Promise<void>;
  togglePin: (id: number) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  login: (token: string, username?: string) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const PAGE_SIZE = 20;
  const [posts, setPosts] = useState<Post[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [auth, setAuth] = useState<AuthState>({
    token: getAuthToken(),
    isLoggedIn: checkLogin(),
    username: null,
  });
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({
    logo_url: null,
    site_title: null,
    show_ip_device: false,
  });

  const refreshPosts = useCallback(async () => {
    try {
      const data = await getPosts(1, PAGE_SIZE);
      const pinned = data.list.filter((p) => p.isPinned).sort(
        (a, b) => new Date(b.pinnedAt || '').getTime() - new Date(a.pinnedAt || '').getTime()
      );
      const unpinned = data.list.filter((p) => !p.isPinned);
      setPosts([...pinned, ...unpinned]);
      setCurrentPage(1);
      setHasMore(data.list.length < data.total);
    } catch (e) {
      console.error('获取帖子失败', e);
    }
  }, []);

  const loadMorePosts = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const data = await getPosts(nextPage, PAGE_SIZE);
      setPosts((prev) => {
        const merged = [...prev, ...data.list];
        const pinned = merged.filter((p) => p.isPinned).sort(
          (a, b) => new Date(b.pinnedAt || '').getTime() - new Date(a.pinnedAt || '').getTime()
        );
        const unpinned = merged.filter((p) => !p.isPinned);
        return [...pinned, ...unpinned];
      });
      setCurrentPage(nextPage);
      setHasMore(posts.length + data.list.length < data.total);
    } catch (e) {
      console.error('加载更多帖子失败', e);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, currentPage, posts.length]);

  const refreshTags = useCallback(async () => {
    try {
      const data = await getTags();
      setTags(data);
    } catch (e) {
      console.error('获取标签失败', e);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!auth.isLoggedIn) {
      setUser(null);
      return;
    }
    try {
      const data = await getUser();
      setUser(data);
      setAuth((prev) => ({ ...prev, username: data.nickname }));
    } catch (e) {
      console.error('获取用户信息失败', e);
    }
  }, [auth.isLoggedIn]);

  const refreshSiteConfig = useCallback(async () => {
    try {
      const data = await getSiteConfig();
      setSiteConfig(data);
    } catch (e) {
      console.error('获取系统设置失败', e);
    }
  }, []);

  const addPost = useCallback(async (data: Omit<Post, 'id' | 'createdAt' | 'views' | 'isPinned' | 'pinnedAt'>): Promise<Post> => {
    const newPost = await createPost(data);
    setPosts((prev) => {
      const pinned = prev.filter((p) => p.isPinned);
      const unpinned = prev.filter((p) => !p.isPinned);
      return [...pinned, newPost, ...unpinned];
    });
    await refreshTags();
    return newPost;
  }, [refreshTags]);

  const editPost = useCallback(async (id: number, data: Partial<Post>) => {
    const updated = await updatePost(id, data);
    if (updated) {
      setPosts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      await refreshTags();
    }
  }, [refreshTags]);

  const removePost = useCallback(async (id: number) => {
    await deletePost(id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
    await refreshTags();
  }, [refreshTags]);

  const togglePin = useCallback(async (id: number) => {
    try {
      const updated = await togglePinPost(id);
      setPosts((prev) => {
        const others = prev.filter((p) => p.id !== id);
        // 置顶帖排在最前，按 pinnedAt 倒序；非置顶保持现有顺序
        const all = [updated, ...others];
        const pinned = all.filter((p) => p.isPinned).sort(
          (a, b) => new Date(b.pinnedAt || '').getTime() - new Date(a.pinnedAt || '').getTime()
        );
        const unpinned = all.filter((p) => !p.isPinned);
        return [...pinned, ...unpinned];
      });
    } catch (e) {
      console.error('置顶操作失败', e);
      throw e;
    }
  }, []);

  const updateUser = useCallback(async (data: User) => {
    try {
      const saved = await getUser();
      setUser(saved);
    } catch {
      // user api may not return the updated user, just set local
      setUser(data);
    }
  }, []);

  const loginFn = useCallback((token: string, username?: string) => {
    setAuth({ token, isLoggedIn: true, username: username || null });
  }, []);

  const logoutFn = useCallback(() => {
    doLogout();
    setAuth({ token: null, isLoggedIn: false, username: null });
    setUser(null);
  }, []);

  // 初始化加载数据
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await refreshSiteConfig();
      if (auth.isLoggedIn) {
        await refreshUser();
      }
      await refreshPosts();
      await refreshTags();
      setLoading(false);
    };
    init();
  }, [auth.isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AppContext.Provider
      value={{
        user,
        posts,
        tags,
        loading,
        loadingMore,
        hasMore,
        auth,
        siteConfig,
        refreshPosts,
        loadMorePosts,
        refreshTags,
        refreshUser,
        refreshSiteConfig,
        addPost,
        editPost,
        removePost,
        togglePin,
        updateUser,
        login: loginFn,
        logout: logoutFn,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useAppStore(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppStore must be used within AppProvider');
  }
  return context;
}
