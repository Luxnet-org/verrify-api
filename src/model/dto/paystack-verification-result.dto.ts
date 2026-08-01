import { PaystackVerificationDataDto } from './paystack-verification-data.dto';

export class PaystackVerificationResultDto {
  data: PaystackVerificationDataDto | null;

  rejectionReason: string | null;
}
