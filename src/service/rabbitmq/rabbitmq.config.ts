import { RabbitMQQueueConfig } from '@golevelup/nestjs-rabbitmq';
import {
  CONTACT_QUEUE_GROUP,
  EMAIL_QUEUE_GROUP,
  RABBITMQ_EXCHANGES,
  RABBITMQ_RETRY,
  RabbitMQQueueGroup,
} from './rabbitmq.constants';

export const createQueueGroupConfiguration = (
  group: RabbitMQQueueGroup,
): RabbitMQQueueConfig[] => [
  {
    name: group.mainQueue,
    exchange: RABBITMQ_EXCHANGES.queue,
    routingKey: group.routingKey,
    options: {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': RABBITMQ_EXCHANGES.retry,
        'x-dead-letter-routing-key': group.routingKey,
      },
    },
  },
  {
    name: group.retryQueue,
    exchange: RABBITMQ_EXCHANGES.retry,
    routingKey: group.routingKey,
    options: {
      durable: true,
      arguments: {
        'x-message-ttl': RABBITMQ_RETRY.delayMs,
        'x-dead-letter-exchange': RABBITMQ_EXCHANGES.queue,
        'x-dead-letter-routing-key': group.routingKey,
      },
    },
  },
  {
    name: group.deadLetterQueue,
    exchange: RABBITMQ_EXCHANGES.deadLetter,
    routingKey: group.routingKey,
    options: {
      durable: true,
    },
  },
];

export const RABBITMQ_QUEUES = [
  ...createQueueGroupConfiguration(EMAIL_QUEUE_GROUP),
  ...createQueueGroupConfiguration(CONTACT_QUEUE_GROUP),
];
