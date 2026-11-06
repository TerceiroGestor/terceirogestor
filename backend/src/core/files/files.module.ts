import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { FilesController } from './files.controller';
import { UploadsController } from './uploads.controller';
import { StorageService } from './storage.service';
import { SignUploadsInterceptor } from './sign-uploads.interceptor';

@Module({
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
