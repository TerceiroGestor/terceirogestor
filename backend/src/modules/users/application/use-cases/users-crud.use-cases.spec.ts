import { NotFoundException } from '@nestjs/common';
import { CreateUserUseCase } from './create-user.use-case';
import { GetUserDetailUseCase } from './get-user-detail.use-case';
import { GetUserProfileUseCase } from './get-user-profile.use-case';
import { ListUsersUseCase } from './list-users.use-case';
import { UpdateUserUseCase } from './update-user.use-case';
import { UsersRepository } from '../../infrastructure/repositories/users.repository';

describe('Users CRUD use cases', () => {
  const repository = {
    findPage: jest.fn(),
    findWithRolesById: jest.fn(),
    findPermissionKeysForRoles: jest.fn(),
    create: jest.fn(),
    findRoleIds: jest.fn(),
    syncUserRoles: jest.fn(),
    update: jest.fn(),
  } as unknown as jest.Mocked<UsersRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists paginated users', async () => {
    repository.findPage.mockResolvedValue([[], 0] as never);
    const useCase = new ListUsersUseCase(repository);

    const result = await useCase.execute('tenant-1', { page: 1, limit: 20 });

    expect(result.pagination.total).toBe(0);
  });

  it('throws when detail user is missing', async () => {
    repository.findWithRolesById.mockResolvedValue(null as never);
    const useCase = new GetUserDetailUseCase(repository);

    await expect(useCase.execute('tenant-1', 'user-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns profile with permissions', async () => {
    repository.findWithRolesById.mockResolvedValue({
      id: 'user-1',
      name: 'Ana',
      email: 'ana@example.com',
      phone: null,
      bio: null,
      avatarUrl: null,
      isActive: true,
      mfaTotpEnabled: false,
      roles: [
        {
          role: { id: 'role-1', name: 'Leitor', description: null },
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);
    repository.findPermissionKeysForRoles.mockResolvedValue(['users.read'] as never);
    const useCase = new GetUserProfileUseCase(repository);

    const result = await useCase.execute('tenant-1', 'user-1');

    expect(result.permissions).toEqual(['users.read']);
  });

  it('creates user and syncs roles', async () => {
    repository.create.mockResolvedValue({ id: 'user-1' } as never);
    repository.findRoleIds.mockResolvedValue([{ id: 'role-1' }] as never);
    repository.syncUserRoles.mockResolvedValue(undefined as never);
    repository.findWithRolesById.mockResolvedValue({
      id: 'user-1',
      name: 'Ana',
      email: 'ana@example.com',
      phone: null,
      bio: null,
      avatarUrl: null,
      isActive: true,
      mfaTotpEnabled: false,
      roles: [
        {
          role: { id: 'role-1', name: 'Leitor', description: null },
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);
    repository.findPermissionKeysForRoles.mockResolvedValue([] as never);
    const profileUseCase = new GetUserProfileUseCase(repository);
    const useCase = new CreateUserUseCase(repository, profileUseCase);

    const result = await useCase.execute('tenant-1', {
      name: 'Ana',
      email: 'ana@example.com',
      password: 'secret1',
    });

    expect(repository.syncUserRoles).toHaveBeenCalledWith(
      'tenant-1',
      'user-1',
      ['role-1'],
    );
    expect(result.id).toBe('user-1');
  });

  it('updates user and returns refreshed profile', async () => {
    repository.findWithRolesById
      .mockResolvedValueOnce({ id: 'user-1' } as never)
      .mockResolvedValueOnce({
        id: 'user-1',
        name: 'Ana',
        email: 'ana@example.com',
        phone: null,
        bio: null,
        avatarUrl: null,
        isActive: true,
        mfaTotpEnabled: false,
        roles: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never);
    repository.update.mockResolvedValue({} as never);
    repository.findPermissionKeysForRoles.mockResolvedValue([] as never);
    const profileUseCase = new GetUserProfileUseCase(repository);
    const useCase = new UpdateUserUseCase(repository, profileUseCase);

    const result = await useCase.execute('tenant-1', 'user-1', {
      name: 'Ana Maria',
    });

    expect(repository.update).toHaveBeenCalledTimes(1);
    expect(result.id).toBe('user-1');
  });
});