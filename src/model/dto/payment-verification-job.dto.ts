export interface WebhookPaymentVerificationJobDto {
  source: 'WEBHOOK';
  webhookEventId: string;
}

export interface ReconciliationPaymentVerificationJobDto {
  source: 'RECONCILIATION';
  transactionId: string;
  attemptCount: number;
}

export type PaymentVerificationJobDto =
  | WebhookPaymentVerificationJobDto
  | ReconciliationPaymentVerificationJobDto;
