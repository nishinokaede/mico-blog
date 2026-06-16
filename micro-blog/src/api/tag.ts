import { Tag } from '../types';
import request from '../utils/request';

/** 后端统一响应包装 */
interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

interface TagRaw {
  name: string;
  count: number;
}

/** 解包统一响应 */
async function unwrap<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const res = await promise;
  if (res.data.code !== 200) {
    throw new Error(res.data.message || '请求失败');
  }
  return res.data.data;
}

export async function getTags(): Promise<Tag[]> {
  const raw = await unwrap<TagRaw[]>(request.get('/mblog/tags'));
  return raw.map((t) => ({ name: t.name, count: t.count }));
}

export async function deleteTag(name: string): Promise<boolean> {
  try {
    await unwrap<unknown>(request.delete(`/mblog/tags/${encodeURIComponent(name)}`));
    return true;
  } catch {
    return false;
  }
}
