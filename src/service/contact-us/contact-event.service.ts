import {
  AmqpConnection,
  Nack,
  RabbitSubscribe,
} from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { ConsumeMessage } from 'amqplib';
import { ContactMeEventRequest } from '../../model/request/contact-me-event-request';
import { ContactMeEventType } from '../../model/enum/contact-me-event-type.enum';
import { NewsletterService } from './newsletter.service';
import {
  CONTACT_QUEUE_GROUP,
  RABBITMQ_EXCHANGES,
} from '../rabbitmq/rabbitmq.constants';
import { RabbitMQRetryService } from '../rabbitmq/rabbitmq-retry.service';

@Injectable()
export class ContactEventService {
  constructor(
    private readonly amqpConnection: AmqpConnection,
    private readonly newsletterService: NewsletterService,
    private readonly retryService: RabbitMQRetryService,
  ) {}

  @RabbitSubscribe({
    queue: CONTACT_QUEUE_GROUP.mainQueue,
    createQueueIfNotExists: false,
  })
  async handleContactRequest(
    contactRequest: ContactMeEventRequest,
    message: ConsumeMessage,
  ): Promise<Nack | void> {
    try {
      if (contactRequest.eventType === ContactMeEventType.SUBSCRIBENEWSLETTER) {
        await this.newsletterService.subscribe(
          contactRequest.subscribeRequest!,
        );
      }
    } catch (error) {
      return this.retryService.handleProcessingFailure(
        message,
        CONTACT_QUEUE_GROUP,
        error,
      );
    }
  }

  async sendContactRequest(
    contactRequest: ContactMeEventRequest,
  ): Promise<void> {
    await this.amqpConnection.publish(
      RABBITMQ_EXCHANGES.queue,
      CONTACT_QUEUE_GROUP.routingKey,
      contactRequest,
    );
  }
}
