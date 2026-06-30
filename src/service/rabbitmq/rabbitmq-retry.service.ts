import { AmqpConnection, Nack } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConsumeMessage } from 'amqplib';
import {
  RABBITMQ_EXCHANGES,
  RABBITMQ_RETRY,
  RabbitMQQueueGroup,
} from './rabbitmq.constants';
import { getRejectedRetryCount } from './rabbitmq-retry.util';

@Injectable()
export class RabbitMQRetryService {
  private readonly logger = new Logger(RabbitMQRetryService.name);

  constructor(private readonly amqpConnection: AmqpConnection) {}

  async handleProcessingFailure(
    message: ConsumeMessage,
    group: RabbitMQQueueGroup,
    error: unknown,
  ): Promise<Nack | void> {
    const retryCount = getRejectedRetryCount(message, group.mainQueue);
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (retryCount < RABBITMQ_RETRY.maxAttempts) {
      this.logger.warn(
        `Queue message processing failed for ${group.mainQueue}; routing to retry queue. Attempt ${retryCount + 1} of ${RABBITMQ_RETRY.maxAttempts}: ${errorMessage}`,
      );
      return new Nack(false);
    }

    try {
      await this.amqpConnection.publish(
        RABBITMQ_EXCHANGES.deadLetter,
        group.routingKey,
        message.content,
        {
          persistent: true,
          headers: message.properties.headers,
        },
      );

      this.logger.error(
        `Maximum retries reached for ${group.mainQueue}; message published to ${group.deadLetterQueue}: ${errorMessage}`,
      );
    } catch (deadLetterError) {
      const deadLetterErrorMessage =
        deadLetterError instanceof Error
          ? deadLetterError.message
          : String(deadLetterError);

      this.logger.error(
        `Failed to publish exhausted message from ${group.mainQueue} to the dead-letter exchange; routing it through the retry queue again: ${deadLetterErrorMessage}`,
      );
      return new Nack(false);
    }
  }
}
