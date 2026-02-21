import { Injectable, OnModuleInit } from '@nestjs/common';
import { EmailService } from './email.service';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { EmailRequest } from '../../model/request/email-request.dto';
import { EmailType } from '../../model/enum/email-type.enum';

@Injectable()
export class EmailEvent implements OnModuleInit {
  private readonly emailQueue = 'verrifyEmail';
  private readonly emailRoutingKey = 'verrifyEmailRoutingKey';

  constructor(
    private readonly emailService: EmailService,
    private readonly rabbitService: RabbitMQService,
  ) { }

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
        } else if (emailRequest.type === EmailType.ACCOUNTREGISTRATION) {
          await this.emailService.sendRegistrationNotificationMail(
            emailRequest,
          );
        } else if (emailRequest.type === EmailType.PASSWORDRESET) {
          await this.emailService.sendResetPasswordNotificationMail(
            emailRequest,
          );
        } else if (emailRequest.type === EmailType.CONTACTMEREPLY) {
          await this.emailService.sendContactMeReply(emailRequest);
        } else if (emailRequest.type === EmailType.ADMINCONTACTMEREPLY) {
          await this.emailService.sendContactMeAdminRequest(emailRequest);
        } else if (emailRequest.type === EmailType.COMPANY_VERIFIED) {
          await this.emailService.sendCompanyVerifiedMail(emailRequest);
        } else if (emailRequest.type === EmailType.COMPANY_REJECTED) {
          await this.emailService.sendCompanyRejectedMail(emailRequest);
        } else if (emailRequest.type === EmailType.PROPERTY_VERIFIED) {
          await this.emailService.sendPropertyVerifiedMail(emailRequest);
        } else if (emailRequest.type === EmailType.PROPERTY_REJECTED) {
          await this.emailService.sendPropertyRejectedMail(emailRequest);
        } else if (emailRequest.type === EmailType.VERIFICATION_PIPELINE_UPDATE) {
          await this.emailService.sendVerificationPipelineUpdateMail(emailRequest);
        } else if (emailRequest.type === EmailType.PAYMENT_RECEIPT) {
          await this.emailService.sendPaymentReceiptMail(emailRequest);
        }
      },
    });
  }

  async sendEmailRequest(emailRequest: EmailRequest): Promise<void> {
    await this.rabbitService.addToQueue(this.emailRoutingKey, emailRequest);
  }
}
