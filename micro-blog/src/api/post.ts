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
  user_id: string;
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
    createdAt: raw.created_at,
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

export async function getPosts(): Promise<Post[]> {
  const raw = await unwrap<PostRaw[]>(request.get('/mblog/posts'));
  return raw.map(toPost).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getPostById(id: number): Promise<Post | undefined> {
  const raw = await unwrap<PostRaw>(request.get(`/mblog/posts/${id}`));
  return raw ? toPost(raw) : undefined;
}

export async function createPost(
  post: Omit<Post, 'id' | 'createdAt' | 'views'>
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
  return raw.map(toPost).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
