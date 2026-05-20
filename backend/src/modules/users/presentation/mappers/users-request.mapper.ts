import type { CreateUserDto } from '../../dto/create-user.dto';
import type { UpdateUserDto } from '../../dto/update-user.dto';
import type { ListUsersQueryDto } from '../dto/list-users-query.dto';
import type {
  CreateUserInput,
  ListUsersInput,
  UpdateUserInput,
} from '../../application/types/user-crud.input';

export const mapListUsersQueryDtoToInput = (
  dto: ListUsersQueryDto,
): ListUsersInput => ({
  page: dto.page,
  limit: dto.limit,
  search: dto.search,
});

export const mapCreateUserDtoToInput = (
  dto: CreateUserDto,
): CreateUserInput => ({
  name: dto.name,
  email: dto.email,
  password: dto.password,
  isActive: dto.isActive,
  roleIds: dto.roleIds,
  avatarUrl: dto.avatarUrl,
});

export const mapUpdateUserDtoToInput = (
  dto: UpdateUserDto,
): UpdateUserInput => ({
  name: dto.name,
  email: dto.email,
  password: dto.password,
  isActive: dto.isActive,
  roleIds: dto.roleIds,
  avatarUrl: dto.avatarUrl,
});