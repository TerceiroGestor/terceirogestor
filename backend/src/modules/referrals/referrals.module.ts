import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { ReferralDestinationsController } from './referral-destinations.controller';
import { ReferralDestinationsService } from './referral-destinations.service';
import { ReferralsController } from './referrals.controller';
import { ReferralsService } from './referrals.service';

@Module({
  imports: [PrismaModule],
  controllers: [ReferralsController, ReferralDestinationsController],
  providers: [ReferralsService, ReferralDestinationsService],
})
export class ReferralsModule {}
