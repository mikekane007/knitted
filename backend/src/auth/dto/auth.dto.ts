import { IsEmail, IsOptional, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @MaxLength(256)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}

export class LoginDto {
  @IsEmail()
  @MaxLength(256)
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;
}

export class UpdateProfileDto {
  @IsString()
  @MaxLength(256)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  bio?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(256)
  location?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(2048)
  avatarUrl?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  wovenThreads?: string | null;
}
