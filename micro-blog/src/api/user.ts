import { User } from '../types';
import request from '../utils/request';
import { setToken, removeToken, saveUser, removeUser } from '../utils/storage';

/** 后端统一响应包装 */
interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

interface UserRaw {
  nickname: string;
  avatar: string;
  email: string;
  bio: string;
  default_visibility: string;
  created_at?: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  user?: {
    username: string;
    nickname?: string;
    avatar?: string;
    email?: string;
  };
}

/** 解包统一响应 */
async function unwrap<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const res = await promise;
  if (res.data.code !== 200) {
    throw new Error(res.data.message || '请求失败');
  }
  return res.data.data;
}

/** 后端 → 前端字段映射 */
function toUser(raw: UserRaw): User {
  return {
    nickname: raw.nickname,
    avatar: raw.avatar || '',
    email: raw.email || '',
    bio: raw.bio || '',
    defaultVisibility: (raw.default_visibility as User['defaultVisibility']) || 'public',
    createdAt: raw.created_at,
  };
}

/** 登录 */
export async function login(username: string, password: string): Promise<{ token: string; user: LoginResponse['user'] }> {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);

  const res = await request.post<ApiResponse<LoginResponse>>('/user/login', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  if (res.data.code !== 200) {
    throw new Error(res.data.message || '登录失败');
  }

  const { access_token, user } = res.data.data;
  setToken(access_token);
  if (user) {
    saveUser(user);
  }
  return { token: access_token, user };
}

/** 退出登录 */
export function logout(): void {
  removeToken();
  removeUser();
}

/** 检查是否已登录 */
export function isLoggedIn(): boolean {
  return !!localStorage.getItem('microblog_token');
}

/** 获取当前 token */
export function getAuthToken(): string | null {
  return localStorage.getItem('microblog_token');
}

export async function getUser(): Promise<User> {
  const raw = await unwrap<UserRaw>(request.get('/mblog/user'));
  return toUser(raw);
}

export async function saveUserProfile(user: User): Promise<User> {
  const body: Record<string, string> = {
    nickname: user.nickname,
    avatar: user.avatar,
    email: user.email,
    bio: user.bio,
    default_visibility: user.defaultVisibility,
  };
  if (user.password) {
    body.password = user.password;
  }

  await unwrap<null>(request.put('/mblog/user', body));
  const { password, ...rest } = user;
  return rest as User;
}

/** 获取系统设置（无需登录） */
export async function getSiteConfig(): Promise<{ logo_url: string | null; site_title: string | null; show_ip_device: boolean }> {
  const res = await request.get('/mblog/site-config');
  return res.data.data;
}

/** 保存系统设置 */
export async function saveSiteConfig(data: { logo_url?: string; site_title?: string; show_ip_device?: boolean }): Promise<void> {
  await unwrap<null>(request.put('/mblog/site-config', data));
}
