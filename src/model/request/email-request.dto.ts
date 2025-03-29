import { EmailType } from '../email-type.enum';

export class EmailRequest {
  type: EmailType;

  subject?: string;

  to: string | string[];

  template?: string;

  context: {
    [index: string]: string;
  };
}
