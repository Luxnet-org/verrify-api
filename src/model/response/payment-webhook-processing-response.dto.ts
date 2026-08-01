import { EmailRequest } from '../request/email-request.dto';

export class PaymentWebhookProcessingResponseDto {
  terminalStatus: 'PROCESSED' | 'IGNORED';

  reason: string;

  receipt?: EmailRequest;
}
