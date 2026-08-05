export class PaystackWebhookDto {
  providerEventId: string;

  eventType: string;

  payload: Record<string, unknown>;

  rawBody: string;

  signature: string;

  sourceIp: string;

  isSupported: boolean;
}
