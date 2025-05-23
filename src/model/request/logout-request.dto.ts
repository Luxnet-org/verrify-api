import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LogoutRequestDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  refreshToken: string;
}
