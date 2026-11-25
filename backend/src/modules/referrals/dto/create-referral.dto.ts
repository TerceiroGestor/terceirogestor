import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ReferralStatus, ReferralType } from '../../../generated/prisma';

export class CreateReferralDto {
  @IsUUID('4')
  evolutionId!: string;

  @IsUUID('4')
  destinationId!: string;

  @IsEnum(ReferralType)
  type!: ReferralType;

  @IsOptional()
  @IsEnum(ReferralStatus)
  status?: ReferralStatus;

  @IsOptional()
  @IsString()
  outcomeNotes?: string | null;
}
