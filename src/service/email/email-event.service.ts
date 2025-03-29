import { Injectable, OnModuleInit } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { EmailService } from '../email/email.service';
import { EmailRequest } from '../email/dto/email-request.dto';
import { EmailType } from '../email/email-type.enum';

@Injectable()
export class EmailEvent implements OnModuleInit {
  private readonly emailQueue = 'aiemrEmail';
  private readonly emailRoutingKey = 'aiemrEmailRoutingKey';

  constructor(
    private readonly emailService: EmailService,
    private readonly rabbitService: RabbitMQService,
  ) {}

  async onModuleInit() {
    await this.setupQueue();
  }

  private async setupQueue(): Promise<void> {
    await this.rabbitService.addQueue({
      name: this.emailQueue,
      routingKey: this.emailRoutingKey,
      handler: async (emailRequest: EmailRequest): Promise<void> => {
        if (emailRequest.type === EmailType.ACCOUNTVERIFICATION) {
          await this.emailService.sendAccountVerificationMail(emailRequest);
        }

        if (emailRequest.type === EmailType.ACCOUNTREGISTRATION) {
          await this.emailService.sendRegistrationNotificationMail(
            emailRequest,
          );
        }

        if (emailRequest.type === EmailType.PASSWORDRESET) {
          await this.emailService.sendResetPasswordNotificationMail(
            emailRequest,
          );
        }
      },
    });
  }

  async sendEmailRequest(emailRequest: EmailRequest): Promise<void> {
    await this.rabbitService.addToQueue(this.emailRoutingKey, emailRequest);
  }
}
