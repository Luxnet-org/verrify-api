export const RABBITMQ_EXCHANGES = {
  queue: 'verrifyQueueExchange',
  retry: 'verrifyRetryExchange',
  deadLetter: 'verrifyEmailDeadLetterQueue',
} as const;

export const RABBITMQ_RETRY = {
  maxAttempts: 5,
  delayMs: 10000,
} as const;

export interface RabbitMQQueueGroup {
  name: string;
  routingKey: string;
  mainQueue: string;
  retryQueue: string;
  deadLetterQueue: string;
}

export const createQueueGroup = (
  name: string,
  routingKey: string,
): RabbitMQQueueGroup => ({
  name,
  routingKey,
  mainQueue: `${name}_nest_queue`,
  retryQueue: `${name}_nest_retry_queue`,
  deadLetterQueue: `${name}_dead_letter_queue`,
});

export const EMAIL_QUEUE_GROUP = createQueueGroup(
  'verrifyEmail',
  'verrifyEmailRoutingKey',
);

// Keep the existing misspelling to preserve the current RabbitMQ queue names.
export const CONTACT_QUEUE_GROUP = createQueueGroup(
  'verrifyConatct',
  'verrifyContactRoutingKey',
);
