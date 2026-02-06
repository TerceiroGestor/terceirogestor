import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { PeopleController } from './people.controller';
import { PeopleService } from './people.service';

@Module({
  imports: [PrismaModule],
  controllers: [PeopleController],
  providers: [PeopleService],
})
export class PeopleModule {}



