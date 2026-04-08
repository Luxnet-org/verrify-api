import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { ConfigInterface } from '../../config-module/configuration';
import { MyLoggerService } from '../logger/my-logger.service';

export interface ResendAttachment {
  /** Display name for the attachment */
  filename: string;
  /** URL to the file (e.g. Cloudinary link) — Resend will fetch it automatically */
  path?: string;
  /** Raw content buffer (alternative to path) */
  content?: Buffer | string;
}

@Injectable()
export class ResendEmailService {
  private readonly logger = new MyLoggerService(ResendEmailService.name);
  private readonly resend: Resend | null;
  private readonly sender: string;

  constructor(
    private readonly configService: ConfigService<ConfigInterface>,
  ) {
    const apiKey = this.configService.get('email.resendAPIKey', { infer: true });
    this.sender = this.configService.get('email.sender', { infer: true })!;

    if (!apiKey) {
      this.logger.warn(
        'Resend API key not configured. Resend emails will fail.',
        ResendEmailService.name,
      );
      this.resend = null;
    } else {
      this.resend = new Resend(apiKey);
    }
  }

  async sendMail(
    to: string | string[],
    subject: string,
    html: string,
    attachments?: ResendAttachment[],
    fromName?: string,
    fromEmail?: string,
  ): Promise<void> {
    if (!this.resend) {
      throw new Error('Resend API key is not configured');
    }

    const toArray = Array.isArray(to) ? to : [to];

    const senderName = fromName || 'Verrify';
    const senderEmailStr = fromEmail || this.sender;

    const fromString = `${senderName} <${senderEmailStr}>`;

    const payload: Parameters<typeof this.resend.emails.send>[0] = {
      from: fromString,
      to: toArray,
      subject,
      html,
    };

    if (attachments && attachments.length > 0) {
      payload.attachments = attachments.map((a) => {
        if (a.path) {
          return { filename: a.filename, path: a.path };
        }
        return {
          filename: a.filename,
          content: typeof a.content === 'string'
            ? Buffer.from(a.content, 'base64')
            : (a.content || Buffer.from('')),
        };
      });
    }

    try {
      const { data, error } = await this.resend.emails.send(payload);
      if (error) {
        this.logger.error(
          `Resend API error: ${error.message}`,
          ResendEmailService.name,
        );
        throw new Error(`Resend API error: ${error.message}`);
      }
      this.logger.log(
        `Email sent via Resend (id: ${data?.id})`,
        ResendEmailService.name,
      );
    } catch (error) {
      this.logger.error(
        `Error sending email via Resend: ${error.message}`,
        ResendEmailService.name,
      );
      throw new Error('Error while sending email');
    }
  }
}

