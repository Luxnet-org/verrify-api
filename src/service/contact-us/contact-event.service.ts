import { Injectable } from '@nestjs/common';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { ContactUsService } from './contact-us.service';
import { ContactMeEventRequest } from '../../model/request/contact-me-event-request';
import { ContactMeEventType } from '../../model/enum/contact-me-event-type.enum';
import { NewsletterService } from './newsletter.service';

@Injectable()
export class ContactEventService {
  private readonly contactQueue = 'verrifyConatct';
  private readonly contactRoutingKey = 'verrifyContactRoutingKey';

  constructor(
    private readonly rabbitService: RabbitMQService,
    private readonly newsletterService: NewsletterService,
  ) {}

  async onModuleInit() {
    await this.setupQueue();
  }

  private async setupQueue(): Promise<void> {
    await this.rabbitService.addQueue({
      name: this.contactQueue,
      routingKey: this.contactRoutingKey,
      handler: async (contactRequest: ContactMeEventRequest): Promise<void> => {
        if (
          contactRequest.eventType === ContactMeEventType.SUBSCRIBENEWSLETTER
        ) {
          await this.newsletterService.subscribe(
            contactRequest.subscribeRequest!,
          );
        }
      },
    });
  }

  async sendContactRequest(
    contactRequest: ContactMeEventRequest,
  ): Promise<void> {
    await this.rabbitService.addToQueue(this.contactRoutingKey, contactRequest);
  }
}
