export class PaystackVerificationDataDto {
  id?: string;

  domain?: string;

  status?: string;

  reference?: string;

  amount?: string;

  currency?: string;

  metadata?: Record<string, unknown> | string | null;
}
