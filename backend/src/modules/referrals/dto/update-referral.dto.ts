import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ReferralStatus, ReferralType } from '../../../generated/prisma';

export class UpdateReferralDto {
  @IsOptional()
  @IsUUID('4')
  destinationId?: string;

  @IsOptional()
  @IsEnum(ReferralType)
  type?: ReferralType;

  @IsOptional()
  @IsEnum(ReferralStatus)
  status?: ReferralStatus;

  @IsOptional()
  @IsString()
  outcomeNotes?: string | null;
}
