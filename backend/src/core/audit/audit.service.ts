import { Injectable } from '@nestjs/common';
import type { AuditLogAction } from '../../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async listAuditLogs(
    tenantId: string,
    params: {
      page?: number;
      limit?: number;
      action?: AuditLogAction;
      entity?: string;
      entityId?: string;
      userId?: string;
      search?: string;
    },
  ) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit =
      params.limit && params.limit > 0 ? Math.min(params.limit, 200) : 20;
    const skip = (page - 1) * limit;
    const action = params.action;
    const entity = params.entity?.trim();
    const entityId = params.entityId?.trim();
    const userId = params.userId?.trim();
    const search = params.search?.trim();
    const searchAction = search ? search.toUpperCase() : undefined;
    const actionCandidate =
      searchAction === 'CREATE' ||
      searchAction === 'UPDATE' ||
      searchAction === 'DELETE'
        ? (searchAction as AuditLogAction)
        : undefined;

    const where = {
      tenantId,
      ...(action ? { action } : {}),
      ...(entity
        ? { entity: { contains: entity, mode: 'insensitive' as const } }
        : {}),
      ...(entityId ? { entityId } : {}),
      ...(userId ? { userId } : {}),
      ...(search
        ? {
            OR: [
              { entity: { contains: search, mode: 'insensitive' as const } },
              { entityId: { contains: search, mode: 'insensitive' as const } },
              { requestId: { contains: search, mode: 'insensitive' as const } },
              ...(actionCandidate ? [{ action: actionCandidate }] : []),
              {
                user: {
                  name: { contains: search, mode: 'insensitive' as const },
                },
              },
              {
                user: {
                  email: { contains: search, mode: 'insensitive' as const },
                },
              },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
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
}
