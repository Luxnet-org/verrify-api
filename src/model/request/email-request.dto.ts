import { EmailType } from '../enum/email-type.enum';

export class EmailRequest {
  type: EmailType;

  subject?: string;

  to: string | string[];

  template?: string;

  context: {
    [index: string]: any;
  };

  attachments?: any[];
}
