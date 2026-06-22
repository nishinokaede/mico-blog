import { Post, SearchParams } from '../types';
import request from '../utils/request';

/** 后端统一响应包装 */
interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

/** 后端返回的帖子字段 (snake_case) */
interface PostRaw {
  id: number;
  content: string;
  tags: string[];
  images: string[];
  video?: string;
  visibility: string;
  views: number;
  ip_address?: string;
  device?: string;
  user_id: string;
  is_pinned?: boolean;
  pinned_at?: string;
  created_at: string;
  updated_at: string;
}

/** 后端 → 前端字段映射 */
function toPost(raw: PostRaw): Post {
  return {
    id: raw.id,
    content: raw.content,
    tags: raw.tags,
    images: raw.images || [],
    video: raw.video || undefined,
    visibility: raw.visibility as Post['visibility'],
    views: raw.views,
    ip_address: raw.ip_address,
    device: raw.device,
    createdAt: raw.created_at,
    isPinned: raw.is_pinned || false,
    pinnedAt: raw.pinned_at,
  };
}

/** 解包统一响应，提取 data */
async function unwrap<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const res = await promise;
  if (res.data.code !== 200) {
    throw new Error(res.data.message || '请求失败');
  }
  return res.data.data;
}

interface PostsResponse {
  list: PostRaw[];
  total: number;
}

export async function getPosts(page = 1, pageSize = 20): Promise<{ list: Post[]; total: number }> {
  const raw = await unwrap<PostsResponse>(
    request.get('/mblog/posts', { params: { page, page_size: pageSize } })
  );
  return {
    list: raw.list.map(toPost),
    total: raw.total,
  };
}

export async function getPostById(id: number): Promise<Post | undefined> {
  const raw = await unwrap<PostRaw>(request.get(`/mblog/posts/${id}`));
  return raw ? toPost(raw) : undefined;
}

export async function createPost(
  post: Omit<Post, 'id' | 'createdAt' | 'views' | 'isPinned' | 'pinnedAt'>
): Promise<Post> {
  const raw = await unwrap<PostRaw>(
    request.post('/mblog/posts', {
      content: post.content,
      tags: post.tags,
      images: post.images,
      video: post.video || null,
      visibility: post.visibility,
    })
  );
  return toPost(raw);
}

export async function updatePost(
  id: number,
  data: Partial<Post>
): Promise<Post | undefined> {
  const body: Record<string, unknown> = {};
  if (data.content !== undefined) body.content = data.content;
  if (data.tags !== undefined) body.tags = data.tags;
  if (data.images !== undefined) body.images = data.images;
  if (data.video !== undefined) body.video = data.video;
  if (data.visibility !== undefined) body.visibility = data.visibility;
  if (data.views !== undefined) body.views = data.views;

  const raw = await unwrap<PostRaw>(request.put(`/mblog/posts/${id}`, body));
  return raw ? toPost(raw) : undefined;
}

export async function deletePost(id: number): Promise<boolean> {
  try {
    await unwrap<null>(request.delete(`/mblog/posts/${id}`));
    return true;
  } catch {
    return false;
  }
}

export async function togglePinPost(id: number): Promise<Post> {
  const raw = await unwrap<PostRaw>(request.post(`/mblog/posts/${id}/toggle-pin`));
  return toPost(raw);
}

export async function searchPosts(params: SearchParams): Promise<Post[]> {
  const queryParams: Record<string, string> = {};
  if (params.tag) queryParams.tag = params.tag;
  if (params.visibility) queryParams.visibility = params.visibility;
  if (params.content) queryParams.content = params.content;
  if (params.dateRange) {
    queryParams.start_date = params.dateRange[0];
    queryParams.end_date = params.dateRange[1];
  }

  const raw = await unwrap<PostRaw[]>(
    request.get('/mblog/search', { params: queryParams })
  );
  const list = raw.map(toPost);
  // 置顶帖在最前，其余按创建时间倒序
  const pinned = list.filter((p) => p.isPinned).sort(
    (a, b) => new Date(b.pinnedAt || '').getTime() - new Date(a.pinnedAt || '').getTime()
  );
  const unpinned = list.filter((p) => !p.isPinned).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return [...pinned, ...unpinned];
}
