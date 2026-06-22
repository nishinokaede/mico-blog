export type Visibility = 'public' | 'private';

export interface Post {
  id: number;
  content: string;
  tags: string[];
  images: string[];
  video?: string;
  visibility: Visibility;
  views: number;
  ip_address?: string;
  device?: string;
  createdAt: string;
  isPinned: boolean;
  pinnedAt?: string;
}

export interface User {
  nickname: string;
  avatar: string;
  email: string;
  bio: string;
  defaultVisibility: Visibility;
  password?: string;
}

export interface Tag {
  name: string;
  count: number;
}

export interface SearchParams {
  tag?: string;
  visibility?: Visibility | 'all';
  content?: string;
  dateRange?: [string, string] | null;
}

export interface AuthState {
  token: string | null;
  isLoggedIn: boolean;
  username: string | null;
}

export interface SiteConfig {
  logo_url: string | null;
  site_title: string | null;
  show_ip_device: boolean;
}
