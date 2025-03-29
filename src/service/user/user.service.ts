import { Injectable } from '@nestjs/common';
import { User } from '../../model/entity/user.entity';
import { UserDto } from '../../model/dto/user.dto';

@Injectable()
export class UserService {
  convertToDto(user: User): UserDto {
    return {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
      role: user.role,
      dob: user.dob,
      phoneNumber: user.phoneNumber,
      address: user.address.address,
      city: user.address.address,
      state: user.address.state,
      lastLogin: user.lastLogin,
      profileImage: user.profileImage.url,
      is2fa: user.is2fa,
      isVerified: user.isVerified,
      isGoogleLogin: user.isGoogleLogin,
      isEnabled: user.isEnabled,
    };
  }
}
