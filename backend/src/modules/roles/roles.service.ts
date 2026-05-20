import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { mapRoleDetail } from './application/mappers/role-response.mapper';
import { RolesRepository } from './infrastructure/repositories/roles.repository';

@Injectable()
export class RolesService {
  constructor(private readonly rolesRepository: RolesRepository) {}

  async listRoles(tenantId: string) {
    const roles = await this.rolesRepository.findManyByTenant(tenantId);
    return roles.map(mapRoleDetail);
  }

  async createRole(tenantId: string, dto: CreateRoleDto) {
    const role = await this.rolesRepository.create(tenantId, dto);

    const permissionIds = await this.rolesRepository.findPermissionIdsByKeys(
      dto.permissionKeys,
    );
    if (permissionIds.length) {
      await this.rolesRepository.syncRolePermissions(
        tenantId,
        role.id,
        permissionIds,
      );
    }

    return this.getRoleDetail(tenantId, role.id);
  }

  async updateRole(tenantId: string, roleId: string, dto: UpdateRoleDto) {
    const existing = await this.rolesRepository.findByIdAndTenant(
      tenantId,
      roleId,
    );
    if (!existing) {
      throw new NotFoundException('Perfil nao encontrado');
    }

    await this.rolesRepository.update(roleId, {
      name: dto.name ?? existing.name,
      description: dto.description ?? existing.description,
    });

    if (dto.permissionKeys) {
      const permissionIds = await this.rolesRepository.findPermissionIdsByKeys(
        dto.permissionKeys,
      );
      await this.rolesRepository.syncRolePermissions(
        tenantId,
        roleId,
        permissionIds,
      );
    }

    return this.getRoleDetail(tenantId, roleId);
  }

  async deleteRole(tenantId: string, roleId: string) {
    const existing = await this.rolesRepository.findByIdAndTenant(
      tenantId,
      roleId,
    );
    if (!existing) {
      throw new NotFoundException('Perfil nao encontrado');
    }

    await this.rolesRepository.deleteCascade(tenantId, roleId);

    return { ok: true };
  }

  async getRoleDetail(tenantId: string, roleId: string) {
    const role = await this.rolesRepository.findByIdAndTenant(tenantId, roleId);
    if (!role) {
      throw new NotFoundException('Perfil nao encontrado');
    }
    return mapRoleDetail(role);
  }
}
