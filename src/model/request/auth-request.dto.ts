import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AuthRequestDto {
  @ApiProperty()
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  // @IsString()
  // @IsOptional()
  // username: string;
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;
}
