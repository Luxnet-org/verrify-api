import { User } from '../entity/user.entity';
import { IsNotEmpty, IsString } from 'class-validator';
import { VerificationType } from '../enum/verification-type';

export class VerificationRequest {
  id?: string;

  @IsString()
  @IsNotEmpty()
  verificationType: VerificationType;

  user: User;

  tokenType: 'otp' | 'token';
}
