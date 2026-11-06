import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from '../prisma/prisma.module';
import { RequestContextModule } from '../request-context/request-context.module';
import { FilesController } from './files.controller';
import { UploadsController } from './uploads.controller';
import { StorageService } from './storage.service';
import { SignUploadsInterceptor } from './sign-uploads.interceptor';

@Module({
  imports: [PrismaModule, RequestContextModule],
  controllers: [FilesController, UploadsController],
  providers: [
    StorageService,
    {
      provide: APP_INTERCEPTOR,
      useClass: SignUploadsInterceptor,
    },
  ],
})
export class FilesModule {}
