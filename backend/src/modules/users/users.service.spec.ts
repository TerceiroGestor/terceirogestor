import { Test, TestingModule } from '@nestjs/testing';
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
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: {} as UsersRepository },
        { provide: ListUsersUseCase, useValue: {} as ListUsersUseCase },
        {
          provide: GetUserDetailUseCase,
          useValue: {} as GetUserDetailUseCase,
        },
        {
          provide: GetUserProfileUseCase,
          useValue: {} as GetUserProfileUseCase,
        },
        { provide: CreateUserUseCase, useValue: {} as CreateUserUseCase },
        { provide: UpdateUserUseCase, useValue: {} as UpdateUserUseCase },
        {
          provide: ListMentionableUsersUseCase,
          useValue: {} as ListMentionableUsersUseCase,
        },
        {
          provide: UpdateMyProfileUseCase,
          useValue: {} as UpdateMyProfileUseCase,
        },
        {
          provide: ChangeMyPasswordUseCase,
          useValue: {} as ChangeMyPasswordUseCase,
        },
        {
          provide: ResetUserMfaUseCase,
          useValue: {} as ResetUserMfaUseCase,
        },
        { provide: DeleteUserUseCase, useValue: {} as DeleteUserUseCase },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
