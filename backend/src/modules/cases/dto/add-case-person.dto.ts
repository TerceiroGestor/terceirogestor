import { IsUUID } from 'class-validator';

export class AddCasePersonDto {
  @IsUUID('4')
  personId!: string;
}
