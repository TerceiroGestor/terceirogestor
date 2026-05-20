import { Injectable } from '@nestjs/common';
import type { AccessLogAction, Prisma } from '../../../generated/prisma';
import { PrismaService } from '../../../../core/prisma/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmailAndTenant(tenantId: string, email: string) {
    return this.prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId,
          email,
        },
      },
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByIdAndTenant(tenantId: string, userId: string) {
    return this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });
  }

  ensureExistsByTenant(tenantId: string, userId: string) {
    return this.prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: { id: true },
    });
  }

  findWithRolesById(tenantId: string, userId: string) {
    return this.prisma.user.findFirst({
      where: { id: userId, tenantId },
      include: { roles: { include: { role: true } } },
    });
  }

  findPage(tenantId: string, params: { skip: number; take: number; search?: string }) {
    const search = params.search?.trim();
    const where = {
      tenantId,
      ...(search
        ? {
            OR: [
              { email: { contains: search } },
              { name: { contains: search } },
            ],
          }
        : {}),
    };

    return this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.take,
        include: { roles: { include: { role: true } } },
      }),
      this.prisma.user.count({ where }),
    ]);
  }

  create(tenantId: string, data: Prisma.UserUncheckedCreateInput) {
    return this.prisma.user.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }

  update(userId: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  updateProfile(
    userId: string,
    dto: { name?: string; phone?: string; bio?: string; avatarUrl?: string },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.bio !== undefined ? { bio: dto.bio } : {}),
        ...(dto.avatarUrl !== undefined
          ? { avatarUrl: dto.avatarUrl.trim() ? dto.avatarUrl : null }
          : {}),
      },
    });
  }

  findActiveCredentials(tenantId: string, userId: string) {
    return this.prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: { id: true, passwordHash: true, isActive: true },
    });
  }

  updatePasswordAndRevokeSessions(
    tenantId: string,
    userId: string,
    passwordHash: string,
    revokedAt: Date,
  ) {
    return this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      }),
      this.prisma.userSession.updateMany({
        where: { tenantId, userId, revokedAt: null },
        data: { revokedAt },
      }),
    ]);
  }

  resetMfa(tenantId: string, userId: string, revokedAt: Date) {
    return this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          mfaTotpEnabled: false,
          mfaTotpSecretEnc: null,
          mfaTotpVerifiedAt: null,
        },
      }),
      this.prisma.userMfaTotpSetup.deleteMany({
        where: { tenantId, userId },
      }),
      this.prisma.userMfaRecoveryCode.deleteMany({
        where: { tenantId, userId },
      }),
      this.prisma.userTrustedDevice.updateMany({
        where: { tenantId, userId, revokedAt: null },
        data: { revokedAt },
      }),
      this.prisma.userMfaChallenge.deleteMany({
        where: { tenantId, userId },
      }),
    ]);
  }

  deleteCascade(tenantId: string, userId: string) {
    return this.prisma.$transaction([
      this.prisma.userRole.deleteMany({
        where: { tenantId, userId },
      }),
      this.prisma.userSession.deleteMany({
        where: { tenantId, userId },
      }),
      this.prisma.accessLog.deleteMany({
        where: { tenantId, userId },
      }),
      this.prisma.user.delete({
        where: { id: userId },
      }),
    ]);
  }

  findPermissionKeysForUser(tenantId: string, userId: string) {
    return this.prisma.role.findMany({
      where: {
        tenantId,
        users: {
          some: {
            userId,
          },
        },
      },
      select: { id: true },
    }).then((roles) =>
      this.findPermissionKeysForRoles(
        tenantId,
        roles.map((role) => role.id),
      ),
    );
  }

  findMentionableUsers(
    tenantId: string,
    permissionKey: string,
    search?: string,
  ) {
    const normalizedSearch = search?.trim();
    return this.prisma.user.findMany({
      where: {
        tenantId,
        isActive: true,
        ...(normalizedSearch
          ? {
              OR: [
                { name: { contains: normalizedSearch } },
                { email: { contains: normalizedSearch } },
              ],
            }
          : {}),
        roles: {
          some: {
            tenantId,
            role: {
              permissions: {
                some: {
                  tenantId,
                  permission: {
                    key: permissionKey,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [{ name: 'asc' }, { email: 'asc' }],
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
    });
  }

  findAccessLogsForUser(
    tenantId: string,
    userId: string,
    params: {
      skip: number;
      take: number;
      action?: 'LOGIN' | 'REFRESH' | 'LOGOUT';
      search?: string;
    },
  ) {
    const search = params.search?.trim();
    const searchAction = search ? search.toUpperCase() : undefined;
    const actionCandidate =
      searchAction === 'LOGIN' ||
      searchAction === 'REFRESH' ||
      searchAction === 'LOGOUT'
        ? (searchAction as AccessLogAction)
        : undefined;

    const where = {
      userId,
      tenantId,
      ...(params.action ? { action: params.action } : {}),
      ...(search
        ? {
            OR: [
              { ipAddress: { contains: search } },
              { userAgent: { contains: search } },
              ...(actionCandidate
                ? [{ action: { equals: actionCandidate } }]
                : []),
            ],
          }
        : {}),
    };

    return this.prisma.$transaction([
      this.prisma.accessLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.accessLog.count({ where }),
    ]);
  }

  findRoleIds(tenantId: string, roleIds?: string[]) {
    if (roleIds && roleIds.length) {
      return this.prisma.role.findMany({
        where: { tenantId, id: { in: roleIds } },
        select: { id: true },
      });
    }

    return this.prisma.role.findMany({
      where: { tenantId, name: 'Leitor' },
      select: { id: true },
      take: 1,
    });
  }

  async syncUserRoles(tenantId: string, userId: string, roleIds: string[]) {
    const current = await this.prisma.userRole.findMany({
      where: { tenantId, userId },
      select: { roleId: true },
    });
    const currentIds = new Set(current.map((item) => item.roleId));
    const targetIds = new Set(roleIds);

    const toRemove = Array.from(currentIds).filter(
      (roleId) => !targetIds.has(roleId),
    );
    const toAdd = Array.from(targetIds).filter(
      (roleId) => !currentIds.has(roleId),
    );

    if (toRemove.length) {
      await this.prisma.userRole.deleteMany({
        where: { tenantId, userId, roleId: { in: toRemove } },
      });
    }
    if (toAdd.length) {
      await this.prisma.userRole.createMany({
        data: toAdd.map((roleId) => ({ tenantId, userId, roleId })),
        skipDuplicates: true,
      });
    }
  }

  findPermissionKeysForRoles(tenantId: string, roleIds: string[]) {
    if (!roleIds.length) {
      return Promise.resolve([] as string[]);
    }

    return this.prisma.rolePermission
      .findMany({
        where: { tenantId, roleId: { in: roleIds } },
        include: { permission: true },
      })
      .then((permissions) =>
        Array.from(new Set(permissions.map((entry) => entry.permission.key))),
      );
  }
}