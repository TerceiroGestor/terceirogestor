import { BadRequestException, Injectable } from '@nestjs/common';
import type {
  Prisma,
  TenantRegistrationMethod,
} from '../../../generated/prisma';
import { PrismaService } from '../../../core/prisma/prisma.service';
import {
  DEFAULT_PERMISSIONS,
  DEFAULT_ROLE_DEFINITIONS,
} from '../../registration.constants';
import { normalizeTenantSlug } from '../../domain/policies/registration-slug.policy';
import { slugify } from '../../registration.utils';

@Injectable()
export class RegistrationRepository {
  constructor(private readonly prisma: PrismaService) {}

  findTenantByName(name: string) {
    return this.prisma.tenant.findUnique({ where: { name } });
  }

  createPendingEmailRegistration(data: {
    tenantName: string;
    tenantSlug: string;
    adminName: string;
    adminEmail: string;
    adminPasswordHash: string;
    verificationCodeHash: string;
    verificationCodeExpiresAt: Date;
  }) {
    return this.prisma.tenantRegistration.create({
      data: {
        method: 'EMAIL',
        status: 'PENDING_VERIFICATION',
        ...data,
      },
      select: { id: true },
    });
  }

  findRegistrationById(id: string) {
    return this.prisma.tenantRegistration.findUnique({ where: { id } });
  }

  createPendingOAuthRegistration(data: {
    method: TenantRegistrationMethod;
    tenantName: string;
    tenantSlug: string;
    oauthStateHash: string;
  }) {
    return this.prisma.tenantRegistration.create({
      data: {
        ...data,
        status: 'PENDING_OAUTH',
      },
      select: { id: true },
    });
  }

  updateRegistration(id: string, data: Prisma.TenantRegistrationUpdateInput) {
    return this.prisma.tenantRegistration.update({
      where: { id },
      data,
    });
  }

  async confirmPendingRegistration(params: {
    registrationId: string;
    tenantName: string;
    tenantSlug: string;
    adminName: string;
    adminEmail: string;
    adminPasswordHash: string;
  }) {
    return this.prisma.$transaction(
      async (tx) => {
        await this.ensureCorePermissions(tx);
        const tenant = await this.createTenantWithUniqueSlug(
          tx,
          params.tenantName,
          params.tenantSlug,
        );
        const { rolesByName } = await this.createDefaultRoles(tx, tenant.id);
        await this.createDefaultRolePermissions(tx, tenant.id, rolesByName);

        const user = await tx.user.create({
          data: {
            tenantId: tenant.id,
            name: params.adminName,
            email: params.adminEmail,
            passwordHash: params.adminPasswordHash,
            isActive: true,
          },
          select: { id: true, tenantId: true },
        });

        const adminRole = rolesByName.get('Admin');
        if (adminRole) {
          await tx.userRole.create({
            data: {
              tenantId: tenant.id,
              userId: user.id,
              roleId: adminRole.id,
            },
          });
        }

        await tx.tenantRegistration.update({
          where: { id: params.registrationId },
          data: {
            status: 'CONFIRMED',
            tenantId: tenant.id,
            adminUserId: user.id,
            confirmedAt: new Date(),
            tenantSlug: tenant.slug,
          },
        });

        return {
          tenantId: tenant.id,
          tenantSlug: tenant.slug,
          userId: user.id,
        };
      },
      { timeout: 60000, maxWait: 20000 },
    );
  }

  findUserAuthContext(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        tenantId: true,
        email: true,
        name: true,
        isActive: true,
        tenant: {
          select: { name: true, slug: true },
        },
      },
    });
  }

  createSessionAndLogLogin(data: {
    tenantId: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.prisma.$transaction([
      this.prisma.userSession.create({
        data: {
          tenantId: data.tenantId,
          userId: data.userId,
          tokenHash: data.tokenHash,
          expiresAt: data.expiresAt,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          updatedAt: new Date(),
        },
      }),
      this.prisma.accessLog.create({
        data: {
          userId: data.userId,
          tenantId: data.tenantId,
          action: 'LOGIN',
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      }),
    ]);
  }

  private async ensureCorePermissions(tx: Prisma.TransactionClient) {
    await tx.permission.createMany({
      data: DEFAULT_PERMISSIONS.map((permission) => ({
        key: permission.key,
        description: permission.description,
      })),
      skipDuplicates: true,
    });
  }

  private async createTenantWithUniqueSlug(
    tx: Prisma.TransactionClient,
    tenantName: string,
    preferredSlug: string,
  ) {
    const base = normalizeTenantSlug(preferredSlug || slugify(tenantName));
    for (let attempt = 0; attempt < 25; attempt += 1) {
      const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
      try {
        const tenant = await tx.tenant.create({
          data: {
            name: tenantName,
            slug: candidate,
            status: 'ACTIVE',
          },
          select: { id: true, slug: true },
        });
        return tenant;
      } catch (error: any) {
        const isUniqueViolation =
          typeof error?.code === 'string' &&
          (error.code === 'P2002' || error.code === 'P2000');
        if (!isUniqueViolation) throw error;
      }
    }
    throw new BadRequestException('Nao foi possivel gerar um slug unico');
  }

  private async createDefaultRoles(
    tx: Prisma.TransactionClient,
    tenantId: string,
  ) {
    const roles = new Map<string, { id: string; name: string }>();
    for (const roleDef of DEFAULT_ROLE_DEFINITIONS) {
      const role = await tx.role.create({
        data: {
          tenantId,
          name: roleDef.name,
          description: roleDef.description,
        },
        select: { id: true, name: true },
      });
      roles.set(role.name, role);
    }
    return { rolesByName: roles };
  }

  private async createDefaultRolePermissions(
    tx: Prisma.TransactionClient,
    tenantId: string,
    rolesByName: Map<string, { id: string; name: string }>,
  ) {
    const permissions = await tx.permission.findMany({
      select: { id: true, key: true },
    });
    const permissionsByKey = new Map(
      permissions.map((permission) => [permission.key, permission.id]),
    );

    const entries: Array<{
      tenantId: string;
      roleId: string;
      permissionId: string;
    }> = [];
    for (const roleDef of DEFAULT_ROLE_DEFINITIONS) {
      const role = rolesByName.get(roleDef.name);
      if (!role) continue;
      for (const key of roleDef.permissionKeys) {
        const permissionId = permissionsByKey.get(key);
        if (!permissionId) continue;
        entries.push({ tenantId, roleId: role.id, permissionId });
      }
    }

    if (!entries.length) return;
    await tx.rolePermission.createMany({ data: entries, skipDuplicates: true });
  }
}