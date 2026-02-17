import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { ProjectStructureController } from './project-structure.controller';
import { ProjectStructureService } from './project-structure.service';

@Module({
  imports: [PrismaModule],
  controllers: [ProjectStructureController],
  providers: [ProjectStructureService],
})
export class ProjectStructureModule {}
