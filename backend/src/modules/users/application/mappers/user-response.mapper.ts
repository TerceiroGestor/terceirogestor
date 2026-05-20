import type { Prisma } from '../../../generated/prisma';

type UserWithRoles = Prisma.UserGetPayload<{
  include: { roles: { include: { role: true } } };
}>;

const mapRole = (entry: UserWithRoles['roles'][number]) => ({
  id: entry.role.id,
  name: entry.role.name,
  description: entry.role.description,
});

export const mapUserDetail = (user: UserWithRoles) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  bio: user.bio,
  avatarUrl: user.avatarUrl,
  isActive: user.isActive,
  mfaTotpEnabled: user.mfaTotpEnabled,
  roles: user.roles.map(mapRole),
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const mapUserProfile = (
  user: UserWithRoles,
  permissions: string[],
) => ({
  ...mapUserDetail(user),
  permissions,
});

export const mapUserListItem = (user: UserWithRoles) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  avatarUrl: user.avatarUrl,
  isActive: user.isActive,
  mfaTotpEnabled: user.mfaTotpEnabled,
  roles: user.roles.map(mapRole),
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});