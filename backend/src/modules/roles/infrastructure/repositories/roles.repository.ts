import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';

@Injectable()
export class RolesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyByTenant(tenantId: string) {
    return this.prisma.role.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });
  }

  findByIdAndTenant(tenantId: string, roleId: string) {
    return this.prisma.role.findFirst({
      where: { id: roleId, tenantId },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });
  }

  create(tenantId: string, data: { name: string; description?: string }) {
    return this.prisma.role.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description ?? null,
      },
    });
  }

  update(roleId: string, data: { name?: string; description?: string | null }) {
    return this.prisma.role.update({
      where: { id: roleId },
      data,
    });
  }

  deleteCascade(tenantId: string, roleId: string) {
    return this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({
        where: { tenantId, roleId },
      }),
      this.prisma.userRole.deleteMany({
        where: { tenantId, roleId },
      }),
      this.prisma.role.delete({
        where: { id: roleId },
      }),
    ]);
  }

  findPermissionIdsByKeys(permissionKeys?: string[]) {
    if (!permissionKeys?.length) return Promise.resolve([] as string[]);
    return this.prisma.permission
      .findMany({
        where: { key: { in: permissionKeys } },
        select: { id: true },
      })
      .then((permissions) => permissions.map((permission) => permission.id));
  }

  async syncRolePermissions(
    tenantId: string,
    roleId: string,
    permissionIds: string[],
  ) {
    const current = await this.prisma.rolePermission.findMany({
      where: { tenantId, roleId },
      select: { permissionId: true },
    });
    const currentIds = new Set(current.map((item) => item.permissionId));
    const targetIds = new Set(permissionIds);

    const toRemove = Array.from(currentIds).filter(
      (permissionId) => !targetIds.has(permissionId),
    );
    const toAdd = Array.from(targetIds).filter(
      (permissionId) => !currentIds.has(permissionId),
    );

    if (toRemove.length) {
      await this.prisma.rolePermission.deleteMany({
        where: { tenantId, roleId, permissionId: { in: toRemove } },
      });
    }

    if (toAdd.length) {
      await this.prisma.rolePermission.createMany({
        data: toAdd.map((permissionId) => ({
          tenantId,
          roleId,
          permissionId,
        })),
        skipDuplicates: true,
      });
    }
  }
}