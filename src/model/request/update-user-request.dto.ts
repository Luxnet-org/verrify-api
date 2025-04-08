import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateUserRequestDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  firstName: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  lastName: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  username: string;

  @ApiPropertyOptional()
  @IsString()
  @IsEmail()
  @IsOptional()
  email: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phoneNumber: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  city: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  state: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  dob: Date;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  profileImageUrl: string;
}
