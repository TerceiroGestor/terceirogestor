import {
  IsDate,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePersonDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  fullName?: string;

  @IsOptional()
  @IsString()
  socialName?: string | null;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  birthDate?: Date | null;

  @IsOptional()
  @IsString()
  gender?: string | null;

  @IsOptional()
  @IsString()
  maritalStatus?: string | null;

  @IsOptional()
  @IsString()
  nationality?: string | null;

  @IsOptional()
  @IsEmail()
  email?: string | null;

  @IsOptional()
  @IsString()
  phone?: string | null;

  @IsOptional()
  @IsString()
  document?: string | null;

  @IsOptional()
  @IsString()
  rg?: string | null;

  @IsOptional()
  @IsString()
  nis?: string | null;

  @IsOptional()
  @IsString()
  @IsIn(['Ativo', 'Inativo', 'Em analise'])
  status?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsString()
  profileSummary?: string | null;

  @IsOptional()
  @IsString()
  avatarUrl?: string | null;
}
