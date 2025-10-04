import { SubscribeNewsletterRequestDto } from './subscribe-newsletter-request.dto';
import { ContactMeEventType } from '../enum/contact-me-event-type.enum';

export class ContactMeEventRequest {
  subscribeRequest?: SubscribeNewsletterRequestDto;

  eventType: ContactMeEventType;
}
