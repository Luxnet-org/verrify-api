import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscribeNewsletterRequestDto } from './subscribe-newsletter-request.dto';
import { ContactMeEventType } from '../enum/contact-me-event-type.enum';

export class ContactMeEventRequest {
  @ApiPropertyOptional({ type: () => SubscribeNewsletterRequestDto })
  subscribeRequest?: SubscribeNewsletterRequestDto;

  @ApiProperty({ enum: ContactMeEventType, description: 'Type of contact me event' })
  eventType: ContactMeEventType;
}
