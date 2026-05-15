import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './core/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { PeopleModule } from './modules/people/people.module';
import { RegistrationModule } from './modules/registration/registration.module';
import { PrismaModule } from './core/prisma/prisma.module';
import { FilesModule } from './core/files/files.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { existsSync } from 'fs';
import { join, resolve } from 'path';
import { TenancyMiddleware } from './core/tenancy/tenancy.middleware';
import { AuditModule } from './core/audit/audit.module';
import { RequestContextModule } from './core/request-context/request-context.module';
import { RequestContextMiddleware } from './core/request-context/request-context.middleware';
import { RequestContextInterceptor } from './core/request-context/request-context.interceptor';
import { RateLimitModule } from './core/rate-limit/rate-limit.module';
import { RateLimitGuard } from './core/rate-limit/rate-limit.guard';
import { CepModule } from './core/cep/cep.module';

const rootEnvFilePaths = [
  resolve(__dirname, '..', '.env.local'),
  resolve(__dirname, '..', '.env'),
  resolve(__dirname, '..', '..', '.env.local'),
  resolve(__dirname, '..', '..', '.env'),
].filter((filepath) => existsSync(filepath));

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: rootEnvFilePaths,
      expandVariables: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: resolve(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    TenantsModule,
    PeopleModule,
    RegistrationModule,
    FilesModule,
    AuditModule,
    RequestContextModule,
    RateLimitModule,
    CepModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    TenancyMiddleware,
    RateLimitGuard,
    {
      provide: APP_GUARD,
      useExisting: RateLimitGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestContextInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenancyMiddleware, RequestContextMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
