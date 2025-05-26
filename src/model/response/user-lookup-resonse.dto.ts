import { ApiProperty } from '@nestjs/swagger';

export class UserLookupResponseDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  profileImageUrl: string | null;
}
