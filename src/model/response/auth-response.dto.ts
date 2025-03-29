import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from '../dto/user.dto';

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  user: UserDto;
}
