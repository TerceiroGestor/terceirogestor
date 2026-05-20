import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { EmailModule } from '../../core/email/email.module';
import { RequestContextModule } from '../../core/request-context/request-context.module';
import { RegistrationController } from './registration.controller';
import { RegistrationService } from './registration.service';
import { ConfirmRegistrationUseCase } from './application/use-cases/confirm-registration.use-case';
import { GetRegistrationUseCase } from './application/use-cases/get-registration.use-case';
import { HandleOAuthRegistrationCallbackUseCase } from './application/use-cases/handle-oauth-registration-callback.use-case';
import { RequestEmailRegistrationUseCase } from './application/use-cases/request-email-registration.use-case';
import { StartOAuthRegistrationUseCase } from './application/use-cases/start-oauth-registration.use-case';
import { RegistrationSessionService } from './application/services/registration-session.service';
import { RegistrationOAuthClient } from './infrastructure/integrations/registration-oauth.client';
import { RegistrationRepository } from './infrastructure/repositories/registration.repository';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    EmailModule,
    RequestContextModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '8h' },
      }),
    }),
  ],
  controllers: [RegistrationController],
  providers: [
    RegistrationService,
    RegistrationRepository,
    RegistrationOAuthClient,
    RegistrationSessionService,
    RequestEmailRegistrationUseCase,
    GetRegistrationUseCase,
    ConfirmRegistrationUseCase,
    StartOAuthRegistrationUseCase,
    HandleOAuthRegistrationCallbackUseCase,
  ],
})
export class RegistrationModule {}
