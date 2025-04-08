import { IsNotEmpty, IsString, Matches } from 'class-validator';
import AppConstants from '../../utility/app-constants';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePasswordRequestDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  oldPassword: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Matches(AppConstants.PASSWORD_REGEX, {
    message: `Password must contain Minimum 8 and maximum 20 characters, 
    at least one uppercase letter, 
    one lowercase letter, 
    one number and 
    one special character`,
  })
  newPassword: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  confirmPassword: string;
}
