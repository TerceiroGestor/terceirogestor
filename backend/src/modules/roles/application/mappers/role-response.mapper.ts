import type { Prisma } from '../../../generated/prisma';

type RoleWithPermissions = Prisma.RoleGetPayload<{
  include: {
    permissions: {
      include: {
        permission: true;
      };
    };
  };
}>;

export const mapRoleDetail = (role: RoleWithPermissions) => ({
  id: role.id,
  name: role.name,
  description: role.description,
  permissions: role.permissions.map((entry) => ({
    id: entry.permission.id,
    key: entry.permission.key,
    description: entry.permission.description,
  })),
  createdAt: role.createdAt,
  updatedAt: role.updatedAt,
});