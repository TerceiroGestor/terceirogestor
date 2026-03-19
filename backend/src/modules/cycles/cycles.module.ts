import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { CyclesController } from './cycles.controller';
import { CyclesService } from './cycles.service';

@Module({
  imports: [PrismaModule],
  controllers: [CyclesController],
  providers: [CyclesService],
})
export class CyclesModule {}
