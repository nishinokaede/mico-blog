import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Post, User, Tag, AuthState, SiteConfig } from '../types';
import { getPosts, createPost, updatePost, deletePost } from '../api/post';
import { getTags } from '../api/tag';
import { getUser, isLoggedIn as checkLogin, getAuthToken, logout as doLogout, getSiteConfig } from '../api/user';

interface AppContextType {
  user: User | null;
  posts: Post[];
  tags: Tag[];
  loading: boolean;
  auth: AuthState;
  siteConfig: SiteConfig;
  refreshPosts: () => Promise<void>;
  refreshTags: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshSiteConfig: () => Promise<void>;
  addPost: (post: Omit<Post, 'id' | 'createdAt' | 'views'>) => Promise<Post>;
  editPost: (id: number, data: Partial<Post>) => Promise<void>;
  removePost: (id: number) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  login: (token: string, username?: string) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState<AuthState>({
    token: getAuthToken(),
    isLoggedIn: checkLogin(),
    username: null,
  });
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({
    logo_url: null,
    site_title: null,
  });

  const refreshPosts = useCallback(async () => {
    try {
      const data = await getPosts();
      setPosts(data);
    } catch (e) {
      console.error('获取帖子失败', e);
    }
  }, []);

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

  const addPost = useCallback(async (data: Omit<Post, 'id' | 'createdAt' | 'views'>): Promise<Post> => {
    const newPost = await createPost(data);
    setPosts((prev) => [newPost, ...prev]);
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
        auth,
        siteConfig,
        refreshPosts,
        refreshTags,
        refreshUser,
        refreshSiteConfig,
        addPost,
        editPost,
        removePost,
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
