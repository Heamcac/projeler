import { IsArray, IsBoolean, IsEmail, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(10)
  password!: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsArray()
  roles!: string[];
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  roles?: string[];
}

export class DepartmentDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class DepartmentLeaderDto {
  @IsUUID()
  departmentId!: string;

  @IsUUID()
  leaderUserId!: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
