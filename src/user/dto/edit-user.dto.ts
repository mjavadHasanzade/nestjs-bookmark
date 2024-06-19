import { IsEmail, IsOptional, IsString } from 'class-validator';

export class EditUserDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastname?: string;

  @IsEmail()
  @IsOptional()
  email?: string;
}
