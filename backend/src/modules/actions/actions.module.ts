import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { ActionTypesController } from './action-types.controller';
import { ProjectActionsController } from './project-actions.controller';
import { ActionsService } from './actions.service';

@Module({
  imports: [PrismaModule],
  controllers: [ActionTypesController, ProjectActionsController],
  providers: [ActionsService],
})
export class ActionsModule {}

