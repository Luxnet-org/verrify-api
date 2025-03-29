import { UserRole } from '../enum/role.enum';

export class UserDto {
  firstName: string;

  lastName: string;

  dob: Date;

  role: UserRole;

  username: string;

  email: string;

  phoneNumber: string;

  address: string;

  city: string;

  state: string;

  lastLogin: Date;

  profileImage: string;

  is2fa: boolean;

  isVerified: boolean;

  isGoogleLogin: boolean;

  isEnabled: boolean;
}
