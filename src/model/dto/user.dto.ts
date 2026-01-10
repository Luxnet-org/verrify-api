import { UserRole } from '../enum/role.enum';
import { DateDto } from '../../utility/date.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UserDto extends DateDto {
  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string | null;

  @ApiProperty()
  dob: Date | null;

  @ApiProperty()
  role: UserRole;

  @ApiProperty()
  username: string | null;

  @ApiProperty()
  email: string;

  @ApiProperty()
  phoneNumber: string | null;

  @ApiProperty()
  address: string | null;

  @ApiProperty()
  city: string | null;

  @ApiProperty()
  state: string | null;

  @ApiProperty()
  lastLogin: Date | null;

  @ApiProperty()
  profileImage: string | null;

  @ApiProperty()
  is2fa: boolean;

  @ApiProperty()
  isVerified: boolean;

  @ApiProperty()
  hasCompanyProfile: boolean;

  @ApiProperty()
  isGoogleLogin: boolean;

  @ApiProperty()
  isEnabled: boolean;
}
