import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTenant(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) {
      throw new NotFoundException('Instituicao nao encontrada');
    }
    return {
      id: tenant.id,
      name: tenant.name,
      logoUrl: tenant.logoUrl,
      cnpj: tenant.cnpj,
      startYear: tenant.startYear,
      description: tenant.description,
      status: tenant.status,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    };
  }

  async updateTenant(tenantId: string, dto: UpdateTenantDto) {
    const existing = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!existing) {
      throw new NotFoundException('Instituicao nao encontrada');
    }

    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name: dto.name ?? existing.name,
        logoUrl: dto.logoUrl ?? existing.logoUrl,
        cnpj: dto.cnpj ?? existing.cnpj,
        startYear: dto.startYear ?? existing.startYear,
        description: dto.description ?? existing.description,
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      logoUrl: updated.logoUrl,
      cnpj: updated.cnpj,
      startYear: updated.startYear,
      description: updated.description,
      status: updated.status,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }
}
