import {
  Injectable,
} from '@nestjs/common';
import { ChangeMyPasswordUseCase } from './application/use-cases/change-my-password.use-case';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case';
import { DeleteUserUseCase } from './application/use-cases/delete-user.use-case';
import { GetUserDetailUseCase } from './application/use-cases/get-user-detail.use-case';
import { GetUserProfileUseCase } from './application/use-cases/get-user-profile.use-case';
import { ListUsersUseCase } from './application/use-cases/list-users.use-case';
import { ListMentionableUsersUseCase } from './application/use-cases/list-mentionable-users.use-case';
import { ResetUserMfaUseCase } from './application/use-cases/reset-user-mfa.use-case';
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case';
import { UpdateMyProfileUseCase } from './application/use-cases/update-my-profile.use-case';
import { UsersRepository } from './infrastructure/repositories/users.repository';
import type {
  CreateUserInput,
  ListUsersInput,
  UpdateUserInput,
} from './application/types/user-crud.input';

@Injectable()
/**
 * @deprecated Fachada transicional para manter compatibilidade externa enquanto o modulo users migra para o blueprint.
 */
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly getUserDetailUseCase: GetUserDetailUseCase,
    private readonly getUserProfileUseCase: GetUserProfileUseCase,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly listMentionableUsersUseCase: ListMentionableUsersUseCase,
    private readonly updateMyProfileUseCase: UpdateMyProfileUseCase,
    private readonly changeMyPasswordUseCase: ChangeMyPasswordUseCase,
    private readonly resetUserMfaUseCase: ResetUserMfaUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
  ) {}

  async listMentionableUsers(
    tenantId: string,
    currentUserId: string,
    permissionKey: string,
    search?: string,
  ) {
    return this.listMentionableUsersUseCase.execute(
      tenantId,
      currentUserId,
      permissionKey,
      search,
    );
  }

  async findByEmailAndTenant(tenantId: string, email: string) {
    return this.usersRepository.findByEmailAndTenant(tenantId, email);
  }

  async findById(id: string) {
    return this.usersRepository.findById(id);
  }

  async getUserDetail(tenantId: string, userId: string) {
    return this.getUserDetailUseCase.execute(tenantId, userId);
  }

  async getProfile(tenantId: string, userId: string) {
    return this.getUserProfileUseCase.execute(tenantId, userId);
  }

  async updateMyProfile(
    tenantId: string,
    userId: string,
    dto: { name?: string; phone?: string; bio?: string; avatarUrl?: string },
  ) {
    return this.updateMyProfileUseCase.execute(tenantId, userId, dto);
  }

  async changeMyPassword(
    tenantId: string,
    userId: string,
    dto: { currentPassword: string; newPassword: string },
  ) {
    return this.changeMyPasswordUseCase.execute(tenantId, userId, dto);
  }

  async listUsers(
    tenantId: string,
    input?: ListUsersInput,
  ) {
    return this.listUsersUseCase.execute(tenantId, input ?? {});
  }

  async createUser(tenantId: string, input: CreateUserInput) {
    return this.createUserUseCase.execute(tenantId, input);
  }

  async updateUser(tenantId: string, userId: string, input: UpdateUserInput) {
    return this.updateUserUseCase.execute(tenantId, userId, input);
  }

  async resetUserMfa(tenantId: string, userId: string) {
    return this.resetUserMfaUseCase.execute(tenantId, userId);
  }

  async deleteUser(tenantId: string, userId: string) {
    return this.deleteUserUseCase.execute(tenantId, userId);
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
    const [data, total] = await this.usersRepository.findAccessLogsForUser(
      tenantId,
      userId,
      {
        skip,
        take: limit,
        action: params.action,
        search: params.search,
      },
    );

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
    return this.usersRepository.findPermissionKeysForUser(tenantId, userId);
  }
}
