import { User } from 'src/user/entities/user.entity';
import { EmailType } from '../../email/email-type.enum';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerificationRequest {
  id?: string;

  @IsString()
  @IsNotEmpty()
  verificationType: EmailType;

  user: User;

  tokenType: 'otp' | 'token';

  // @IsEmail()
  // @IsString()
  // @IsOptional()
  // email?: string;
}
