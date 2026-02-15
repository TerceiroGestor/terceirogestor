import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './core/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { PeopleModule } from './modules/people/people.module';
import { PantryModule } from './modules/pantry/pantry.module';
import { RegistrationModule } from './modules/registration/registration.module';
import { PrismaModule } from './core/prisma/prisma.module';
import { FilesModule } from './core/files/files.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { TenancyMiddleware } from './core/tenancy/tenancy.middleware';
import { AuditModule } from './core/audit/audit.module';
import { RequestContextModule } from './core/request-context/request-context.module';
import { RequestContextMiddleware } from './core/request-context/request-context.middleware';
import { RequestContextInterceptor } from './core/request-context/request-context.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    TenantsModule,
    PeopleModule,
    PantryModule,
    RegistrationModule,
    FilesModule,
    AuditModule,
    RequestContextModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    TenancyMiddleware,
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

