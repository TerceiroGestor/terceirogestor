import { Test, TestingModule } from '@nestjs/testing';
import { PATH_METADATA } from '@nestjs/common/constants';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../core/authorization/permissions.guard';

describe('UsersController', () => {
  let controller: UsersController;
  const usersService = {
    listUsers: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
  } as Partial<UsersService>;

  beforeEach(async () => {
    jest.clearAllMocks();

    const builder = Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true });

    const module: TestingModule = await builder.compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('keeps the users route', () => {
    expect(Reflect.getMetadata(PATH_METADATA, UsersController)).toBe('users');
  });

  it('maps list query DTO to application input', async () => {
    usersService.listUsers = jest.fn().mockResolvedValue({ data: [] });

    await controller.listUsers(
      { tenantId: 'tenant-1', userId: 'user-1' } as never,
      { page: 2, limit: 30, search: 'ana' },
    );

    expect(usersService.listUsers).toHaveBeenCalledWith('tenant-1', {
      page: 2,
      limit: 30,
      search: 'ana',
    });
  });

  it('maps create DTO to application input', async () => {
    usersService.createUser = jest.fn().mockResolvedValue({ id: 'user-1' });

    await controller.createUser(
      { tenantId: 'tenant-1', userId: 'admin-1' } as never,
      {
        name: 'Ana',
        email: 'ana@example.com',
        password: 'secret1',
        roleIds: ['role-1'],
      },
    );

    expect(usersService.createUser).toHaveBeenCalledWith('tenant-1', {
      name: 'Ana',
      email: 'ana@example.com',
      password: 'secret1',
      isActive: undefined,
      roleIds: ['role-1'],
      avatarUrl: undefined,
    });
  });
});
