import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmailAndTenant(tenantId: string, email: string) {
    return this.prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId,
          email,
        },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async getUserDetail(tenantId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
      include: { roles: { include: { role: true } } },
    });
    if (!user) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      mfaTotpEnabled: user.mfaTotpEnabled,
      roles: user.roles.map((entry) => ({
        id: entry.role.id,
        name: entry.role.name,
        description: entry.role.description,
      })),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async getProfile(tenantId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
      include: {
        roles: { include: { role: true } },
      },
    });
    if (!user) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    const roles = user.roles.map((entry) => entry.role);
    const permissions = await this.getPermissionKeysForRoles(
      tenantId,
      roles.map((role) => role.id),
    );

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      mfaTotpEnabled: user.mfaTotpEnabled,
      roles: roles.map((role) => ({
        id: role.id,
        name: role.name,
        description: role.description,
      })),
      permissions,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async updateMyProfile(
    tenantId: string,
    userId: string,
    dto: { name?: string; phone?: string; bio?: string; avatarUrl?: string },
  ) {
    const existing = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    await this.prisma.user.update({
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

    return this.getProfile(tenantId, userId);
  }

  async listUsers(
    tenantId: string,
    params?: { page?: number; limit?: number; search?: string },
  ) {
    const page = params?.page && params.page > 0 ? params.page : 1;
    const limit =
      params?.limit && params.limit > 0 ? Math.min(params.limit, 200) : 20;
    const skip = (page - 1) * limit;
    const search = params?.search?.trim();

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

    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { roles: { include: { role: true } } },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: data.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        isActive: user.isActive,
        roles: user.roles.map((entry) => ({
          id: entry.role.id,
          name: entry.role.name,
          description: entry.role.description,
        })),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async createUser(tenantId: string, dto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        tenantId,
        name: dto.name,
        email: dto.email,
        passwordHash,
        isActive: dto.isActive ?? true,
      },
    });

    const roleIds = await this.resolveRoleIds(tenantId, dto.roleIds);
    if (roleIds.length) {
      await this.prisma.userRole.createMany({
        data: roleIds.map((roleId) => ({
          tenantId,
          userId: user.id,
          roleId,
        })),
        skipDuplicates: true,
      });
    }

    return this.getProfile(tenantId, user.id);
  }

  async updateUser(tenantId: string, userId: string, dto: UpdateUserDto) {
    const existing = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });
    if (!existing) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    const updateData: {
      name?: string;
      email?: string;
      passwordHash?: string;
      isActive?: boolean;
    } = {};

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.password) {
      updateData.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    if (dto.roleIds) {
      const roleIds = await this.resolveRoleIds(tenantId, dto.roleIds);
      await this.syncUserRoles(tenantId, userId, roleIds);
    }

    return this.getProfile(tenantId, userId);
  }

  async deleteUser(tenantId: string, userId: string) {
    const existing = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });
    if (!existing) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    await this.prisma.userRole.deleteMany({
      where: { tenantId, userId },
    });
    await this.prisma.userSession.deleteMany({
      where: { tenantId, userId },
    });
    await this.prisma.accessLog.deleteMany({
      where: { tenantId, userId },
    });
    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { ok: true };
  }

  async getAccessLogsForUser(
    tenantId: string,
    userId: string,
    params: {
      page?: number;
      limit?: number;
      action?: 'LOGIN' | 'REFRESH' | 'LOGOUT';
      search?: string;
    },
  ) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit =
      params.limit && params.limit > 0 ? Math.min(params.limit, 200) : 20;
    const skip = (page - 1) * limit;
    const action = params.action;
    const search = params.search?.trim();
    const searchAction = search ? search.toUpperCase() : undefined;
    const actionCandidate =
      searchAction === 'LOGIN' ||
      searchAction === 'REFRESH' ||
      searchAction === 'LOGOUT'
        ? (searchAction as 'LOGIN' | 'REFRESH' | 'LOGOUT')
        : undefined;

    const where = {
      userId,
      tenantId,
      ...(action ? { action } : {}),
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

    const [data, total] = await this.prisma.$transaction([
      this.prisma.accessLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.accessLog.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async getUserPermissions(tenantId: string, userId: string) {
    const roles = await this.prisma.role.findMany({
      where: {
        tenantId,
        users: {
          some: {
            userId,
          },
        },
      },
      select: { id: true },
    });
    return this.getPermissionKeysForRoles(
      tenantId,
      roles.map((role) => role.id),
    );
  }

  private async resolveRoleIds(tenantId: string, roleIds?: string[]) {
    if (roleIds && roleIds.length) {
      const roles = await this.prisma.role.findMany({
        where: { tenantId, id: { in: roleIds } },
        select: { id: true },
      });
      return roles.map((role) => role.id);
    }

    const defaultRole = await this.prisma.role.findFirst({
      where: { tenantId, name: 'Leitor' },
      select: { id: true },
    });
    return defaultRole ? [defaultRole.id] : [];
  }

  private async syncUserRoles(
    tenantId: string,
    userId: string,
    roleIds: string[],
  ) {
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

  private async getPermissionKeysForRoles(tenantId: string, roleIds: string[]) {
    if (!roleIds.length) return [];

    const roles = await this.prisma.role.findMany({
      where: { tenantId, id: { in: roleIds } },
      select: { name: true },
    });
    if (roles.some((role) => role.name === 'Admin')) {
      const all = await this.prisma.permission.findMany({ select: { key: true } });
      return all.map((permission) => permission.key);
    }

    const permissions = await this.prisma.rolePermission.findMany({
      where: { tenantId, roleId: { in: roleIds } },
      include: { permission: true },
    });
    return Array.from(
      new Set(permissions.map((entry) => entry.permission.key)),
    );
  }
}
