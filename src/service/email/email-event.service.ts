import {
  AmqpConnection,
  Nack,
  RabbitSubscribe,
} from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { ConsumeMessage } from 'amqplib';
import { EmailService } from './email.service';
import { EmailRequest } from '../../model/request/email-request.dto';
import { EmailType } from '../../model/enum/email-type.enum';
import {
  EMAIL_QUEUE_GROUP,
  RABBITMQ_EXCHANGES,
} from '../rabbitmq/rabbitmq.constants';
import { RabbitMQRetryService } from '../rabbitmq/rabbitmq-retry.service';

@Injectable()
export class EmailEvent {
  constructor(
    private readonly emailService: EmailService,
    private readonly amqpConnection: AmqpConnection,
    private readonly retryService: RabbitMQRetryService,
  ) {}

  @RabbitSubscribe({
    queue: EMAIL_QUEUE_GROUP.mainQueue,
    createQueueIfNotExists: false,
  })
  async handleEmailRequest(
    emailRequest: EmailRequest,
    message: ConsumeMessage,
  ): Promise<Nack | void> {
    try {
      if (emailRequest.type === EmailType.ACCOUNTVERIFICATION) {
        await this.emailService.sendAccountVerificationMail(emailRequest);
      } else if (emailRequest.type === EmailType.ACCOUNTREGISTRATION) {
        await this.emailService.sendRegistrationNotificationMail(emailRequest);
      } else if (emailRequest.type === EmailType.PASSWORDRESET) {
        await this.emailService.sendResetPasswordNotificationMail(emailRequest);
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
        await this.emailService.sendVerificationPipelineUpdateMail(
          emailRequest,
        );
      } else if (emailRequest.type === EmailType.PAYMENT_RECEIPT) {
        await this.emailService.sendPaymentReceiptMail(emailRequest);
      }
    } catch (error) {
      return this.retryService.handleProcessingFailure(
        message,
        EMAIL_QUEUE_GROUP,
        error,
      );
    }
  }

  async sendEmailRequest(emailRequest: EmailRequest): Promise<void> {
    await this.amqpConnection.publish(
      RABBITMQ_EXCHANGES.queue,
      EMAIL_QUEUE_GROUP.routingKey,
      emailRequest,
    );
  }
}
