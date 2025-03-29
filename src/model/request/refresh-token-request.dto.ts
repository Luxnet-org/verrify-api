import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenRequestDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  refreshToken: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  userId: string;
}
