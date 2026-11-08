export const ROLES = ['admin', 'user', 'editor'] as const;
export type Role = (typeof ROLES)[number];

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  /** Set when the user is soft-deleted; soft-deleted users are hidden from every list. */
  deletedAt: string | null;
}

/** The fields an admin can edit (create and update). */
export type UserInput = Pick<User, 'name' | 'email' | 'role' | 'isActive'>;

export type UserSortField = 'name' | 'email' | 'role' | 'isActive' | 'createdAt';
export type SortOrder = 'asc' | 'desc';
export type UserStatusFilter = 'active' | 'inactive';

export interface UserListParams {
  page: number;
  pageSize: number;
  sortBy: UserSortField;
  sortOrder: SortOrder;
  search?: string;
  role?: Role;
  status?: UserStatusFilter;
}
