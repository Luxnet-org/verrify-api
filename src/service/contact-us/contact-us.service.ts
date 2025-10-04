import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { MyLoggerService } from '../logger/my-logger.service';
import { ConfigService } from '@nestjs/config';
import { ConfigInterface } from '../../config-module/configuration';
import { JWT } from 'google-auth-library';
import { SubscribeNewsletterRequestDto } from '../../model/request/subscribe-newsletter-request.dto';
import { google } from 'googleapis';
import { DateUtility } from '../../utility/date-utility';
import { ContactUsRequestDto } from '../../model/request/contact-us-request.dto';
import { EmailType } from '../../model/enum/email-type.enum';
import { EmailEvent } from '../email/email-event.service';
import { ContactEventService } from './contact-event.service';
import { ContactMeEventType } from '../../model/enum/contact-me-event-type.enum';

@Injectable()
export class ContactUsService {
  private readonly logger: MyLoggerService = new MyLoggerService(
    ContactUsService.name,
  );

  constructor(
    private readonly configService: ConfigService<ConfigInterface>,
    private readonly emailEventService: EmailEvent,
    private readonly contactEventService: ContactEventService,
  ) {}

  async subscribeRequest(
    request: SubscribeNewsletterRequestDto,
  ): Promise<string> {
    await this.contactEventService.sendContactRequest({
      eventType: ContactMeEventType.SUBSCRIBENEWSLETTER,
      subscribeRequest: request,
    });

    this.logger.log(
      `Successfully subscribed email: ${request.email} to newsletter`,
      ContactUsService.name,
    );

    return 'Subscribed to the newsletter successfully.';
  }

  async contactRequest(request: ContactUsRequestDto): Promise<string> {
    const { email, message, name, phone } = request;

    const supportMail: string = this.configService.get('email.adminEmail', {
      infer: true,
    })!;

    await this.emailEventService.sendEmailRequest({
      type: EmailType.CONTACTMEREPLY,
      to: email,
      context: {
        userName: name,
        message: message,
        supportMail,
      },
    });

    await this.emailEventService.sendEmailRequest({
      type: EmailType.ADMINCONTACTMEREPLY,
      to: supportMail,
      context: {
        userName: name,
        message,
        email,
        phone: phone ? phone : 'Not Provided',
      },
    });

    return 'Message received successfully.';
  }
}
