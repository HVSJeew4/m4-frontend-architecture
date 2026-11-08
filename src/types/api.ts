import type { User } from './user';

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** Body of every non-2xx API response. */
export interface ApiErrorBody {
  message: string;
  /** Per-field messages for validation (400) and conflict (409) errors. */
  fieldErrors?: Record<string, string>;
}

export interface Credentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
