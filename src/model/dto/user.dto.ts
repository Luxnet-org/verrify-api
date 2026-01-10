import { UserRole } from '../enum/role.enum';
import { DateDto } from '../../utility/date.dto';

export class UserDto extends DateDto {
  firstName: string;

  lastName: string | null;

  dob: Date | null;

  role: UserRole;

  username: string | null;

  email: string;

  phoneNumber: string | null;

  address: string | null;

  city: string | null;

  state: string | null;

  lastLogin: Date | null;

  profileImage: string | null;

  is2fa: boolean;

  isVerified: boolean;

  hasCompanyProfile: boolean;

  isGoogleLogin: boolean;

  isEnabled: boolean;
}
