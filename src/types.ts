// @/types/index.ts

export interface Category {
  id: string; // UUID from Django
  slug: string;
  name: string;
  description?: string | null;

  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;

  is_deleted?: boolean;
  deleted_at?: string | null;
  deleted_by?: string | null;
}

export interface CategoryCreateRequest {
  name: string;
  slug: string;
  description?: string | null;
}

export interface CategoryUpdateRequest {
  name: string;
  slug: string;
  description?: string | null;
}


export interface Article {
  id: string;
  title: string;
  slug: string;
  thumbnail_url: string | null;
  author: string;
  read_estimation: number | null;
  body: string;
  published_at: string | null;
  created_at: string;
  blog_category: Category | null;
}

export interface ArticleCreateRequest {
  title: string;
  slug: string;
  thumbnail_url?: string | null;
  read_estimation?: number | null;
  body: string;
  blog_category?: string | null;
}

// SOLUSI 1: Tambahkan setidaknya satu property (rekomendasi)
export interface ArticleUpdateRequest extends Partial<ArticleCreateRequest> {
  // Tambahkan property opsional untuk update
  modified_at?: string;
}

export interface Group {
  id: string;
  name: string;
  // Add other group properties if needed
}

export interface User {
  id: string;
  username: string;
  email: string;
  groups?: Group[];
}

export interface UserCreateRequest {
  username: string;
  email: string;
  password: string;
  role: string[];
}

export interface UserUpdateRequest extends Partial<UserCreateRequest> {
  password?: string;
}


export interface Article {
  id: string;
  title: string;
  slug: string;
  thumbnail_url: string | null;
  author: string;
  read_estimation: number | null;
  body: string;
  published_at: string | null;
  created_at: string;
  blog_category: Category | null;
}

export interface User {
  id: string;
  username: string;
  email: string;
  groups?: Group[];
  created_at?: string;
}

export interface Group {
  id: string;
  name: string;
}
