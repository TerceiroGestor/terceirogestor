import { Test, TestingModule } from '@nestjs/testing';
import { PATH_METADATA } from '@nestjs/common/constants';
import { PersonService } from './person.service';
import { PersonController } from './person.controller';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../core/authorization/permissions.guard';

describe('PersonController', () => {
  let controller: PersonController;
  const personService = {
    create: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
  } as Partial<PersonService>;

  beforeEach(async () => {
    jest.clearAllMocks();

    const builder = Test.createTestingModule({
      controllers: [PersonController],
      providers: [{ provide: PersonService, useValue: personService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true });

    const module: TestingModule = await builder.compile();

    controller = module.get<PersonController>(PersonController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('keeps the legacy people route', () => {
    expect(Reflect.getMetadata(PATH_METADATA, PersonController)).toBe('people');
  });

  it('maps create DTO to application input', async () => {
    personService.create = jest.fn().mockResolvedValue({ id: 'person-1' });

    await controller.create(
      { tenantId: 'tenant-1', userId: 'user-1' } as never,
      {
        fullName: 'Maria da Silva',
        status: 'Ativo',
        tags: [' alpha '],
      },
    );

    expect(personService.create).toHaveBeenCalledWith('tenant-1', {
      fullName: 'Maria da Silva',
      socialName: undefined,
      birthDate: undefined,
      sex: undefined,
      gender: undefined,
      maritalStatus: undefined,
      raceColor: undefined,
      nationality: undefined,
      email: undefined,
      phone: undefined,
      status: 'Ativo',
      personType: undefined,
      departureReason: undefined,
      notes: undefined,
      tags: [' alpha '],
      profileSummary: undefined,
      avatarUrl: undefined,
    });
  });

  it('maps list query DTO to application input', async () => {
    personService.findAll = jest.fn().mockResolvedValue({ data: [] });

    await controller.findAll(
      { tenantId: 'tenant-1', userId: 'user-1' } as never,
      { page: 1, limit: 20, q: 'maria', all: false, filters: 'x', groupBy: 'y' },
    );

    expect(personService.findAll).toHaveBeenCalledWith('tenant-1', {
      all: false,
      page: 1,
      limit: 20,
      q: 'maria',
      filters: 'x',
      groupBy: 'y',
    });
  });
});
