import { createHash } from 'crypto';
import { PaystackVerificationDataDto } from '../model/dto/paystack-verification-data.dto';
import { parseStringPreservingJson } from './string-preserving-json';

export const PAYSTACK_WEBHOOK_IPS = new Set([
  '52.31.139.75',
  '52.49.173.169',
  '52.214.14.220',
]);

const SUPPORTED_PAYSTACK_EVENTS = new Set(['charge.success']);

export const normalizeHttpIpAddress = (ip: string): string =>
  ip.startsWith('::ffff:') ? ip.slice('::ffff:'.length) : ip;

export const normalizePaystackString = (value: unknown): string | null => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return null;
};

export const normalizePaystackVerificationData = (
  data: PaystackVerificationDataDto,
): PaystackVerificationDataDto => ({
  id: normalizePaystackString(data.id) ?? undefined,
  domain: normalizePaystackString(data.domain) ?? undefined,
  status: normalizePaystackString(data.status) ?? undefined,
  reference: normalizePaystackString(data.reference) ?? undefined,
  amount: normalizePaystackString(data.amount) ?? undefined,
  currency: normalizePaystackString(data.currency) ?? undefined,
  metadata: data.metadata,
});

export const extractPaystackWebhookReference = (
  payload: Record<string, unknown>,
): string | null => {
  const data = payload.data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return null;
  }
  return normalizePaystackString((data as Record<string, unknown>).reference);
};

export const extractPaystackMetadataOrderId = (
  metadata: Record<string, unknown> | string | null | undefined,
): string | null => {
  if (!metadata) return null;
  if (typeof metadata === 'string') {
    try {
      const parsed =
        parseStringPreservingJson<Record<string, unknown>>(metadata);
      return normalizePaystackString(parsed.orderId);
    } catch {
      return null;
    }
  }
  return normalizePaystackString(metadata.orderId);
};

export const generatePaystackProviderEventId = (
  eventType: string,
  rawBody: Buffer,
): string =>
  `PAYSTACK:${eventType}:${createHash('sha256').update(rawBody).digest('hex')}`;

export const isSupportedPaystackEvent = (eventType: string): boolean =>
  SUPPORTED_PAYSTACK_EVENTS.has(eventType);
