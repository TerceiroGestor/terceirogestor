export type ListUsersInput = {
  page?: number;
  limit?: number;
  search?: string;
};

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  isActive?: boolean;
  roleIds?: string[];
  avatarUrl?: string;
};

export type UpdateUserInput = {
  name?: string;
  email?: string;
  password?: string;
  isActive?: boolean;
  roleIds?: string[];
  avatarUrl?: string;
};