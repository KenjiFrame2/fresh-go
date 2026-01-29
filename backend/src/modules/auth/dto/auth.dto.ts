import { IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @IsString() @IsNotEmpty()
  phone: string;

  @IsString() @MinLength(6)
  password: string;

  @IsString() @IsNotEmpty()
  fullName: string;

  @IsEnum(UserRole)
  role: UserRole;
}

export class LoginDto {
  @IsString() @IsNotEmpty()
  phone: string;

  @IsString()
  password: string;
}
