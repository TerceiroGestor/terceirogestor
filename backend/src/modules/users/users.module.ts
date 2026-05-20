import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { AuthorizationModule } from '../../core/authorization/authorization.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
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

@Module({
  imports: [PrismaModule, AuthorizationModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    UsersRepository,
    CreateUserUseCase,
    GetUserDetailUseCase,
    GetUserProfileUseCase,
    ListUsersUseCase,
    ListMentionableUsersUseCase,
    UpdateUserUseCase,
    UpdateMyProfileUseCase,
    ChangeMyPasswordUseCase,
    ResetUserMfaUseCase,
    DeleteUserUseCase,
  ],
  exports: [UsersService],
})
export class UsersModule {}
