import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { CloudStorageService } from './cloud-storage.service';

@Module({
  controllers: [FilesController],
  providers: [CloudStorageService],
})
export class FilesModule {}
