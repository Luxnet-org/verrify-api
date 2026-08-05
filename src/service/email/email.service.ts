import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';
import { Injectable, Optional } from '@nestjs/common';
import { MyLoggerService } from '../logger/my-logger.service';
import { EmailRequest } from '../../model/request/email-request.dto';
import { ConfigService } from '@nestjs/config';
import { ConfigInterface } from 'src/config-module/configuration';
import { ResendEmailService } from './resend-email.service';
import { TEMPLATE_MAP } from './html-templates';
import { FileService } from '../file/file.service';

const MAX_EMAIL_SIZE_BYTES = 40_000_000;
const EMAIL_BODY_ALLOWANCE_BYTES = 512 * 1024;

@Injectable()
export class EmailService {
  private readonly logger: MyLoggerService = new MyLoggerService(
    EmailService.name,
  );
  private readonly provider: 'resend' | 'smtp';

  constructor(
    @Optional() private readonly mailerService: MailerService,
    private readonly configService: ConfigService<ConfigInterface>,
    private readonly resendEmailService: ResendEmailService,
    private readonly fileService: FileService,
  ) {
    this.provider =
      this.configService.get('email.provider', { infer: true }) || 'smtp';
    this.logger.log(`Email provider: ${this.provider}`, EmailService.name);
  }

  private async sendMail(
    to: string | string[],
    subject: string,
    template: string,
    context: ISendMailOptions['context'],
    attachments?: any[],
    fromName?: string,
    fromEmail?: string,
  ): Promise<void> {
    if (this.provider === 'resend') {
      await this.sendViaResend(
        to,
        subject,
        template,
        context,
        attachments,
        fromName,
        fromEmail,
      );
    } else {
      await this.sendViaSmtp(
        to,
        subject,
        template,
        context,
        attachments,
        fromName,
        fromEmail,
      );
    }
  }

  private async sendViaSmtp(
    to: string | string[],
    subject: string,
    template: string,
    context: ISendMailOptions['context'],
    attachments?: any[],
    fromName?: string,
    fromEmail?: string,
  ): Promise<void> {
    if (!this.mailerService) {
      throw new Error(
        'MailerService is not available. EMAIL_PROVIDER is set to "smtp" but MailerModule was not loaded.',
      );
    }

    const senderName = fromName || 'Verrify';
    const senderEmailStr =
      fromEmail || this.configService.get('email.sender', { infer: true });
    const fromString = `"${senderName}" <${senderEmailStr}>`;

    const sendMailParams: ISendMailOptions = {
      to,
      from: fromString,
      subject,
      template,
      context,
    };
    if (attachments) {
      sendMailParams.attachments = attachments;
    }

    try {
      await this.mailerService.sendMail(sendMailParams);
      this.logger.log(`Email sent via SMTP`, EmailService.name);
    } catch (error) {
      this.logger.error(
        `Error while sending email via SMTP, Message: ${error.message}`,
        EmailService.name,
      );
      throw new Error('Error while sending email');
    }
  }

  private async sendViaResend(
    to: string | string[],
    subject: string,
    template: string,
    context: ISendMailOptions['context'],
    attachments?: any[],
    fromName?: string,
    fromEmail?: string,
  ): Promise<void> {
    const templateFn = TEMPLATE_MAP[template];
    if (!templateFn) {
      throw new Error(`No HTML template found for: ${template}`);
    }

    const html = templateFn(context || {});
    const resendAttachments = attachments?.map((a) => ({
      filename: a.filename || 'attachment',
      ...(a.path ? { path: a.path } : {}),
      ...(a.content ? { content: a.content } : {}),
    }));

    await this.resendEmailService.sendMail(
      to,
      subject,
      html,
      resendAttachments,
      fromName,
      fromEmail,
    );
  }

  async sendAccountVerificationMail(emailRequest: EmailRequest): Promise<void> {
    await this.sendMail(
      emailRequest.to,
      'Account Verification Notification',
      'account-verification-email-template',
      emailRequest.context,
    );
  }

  async sendRegistrationNotificationMail(
    emailRequest: EmailRequest,
  ): Promise<void> {
    await this.sendMail(
      emailRequest.to,
      'Account Registration Confirmation',
      'signup-confirmation-email-template',
      emailRequest.context,
    );
  }

  async sendResetPasswordNotificationMail(
    emailRequest: EmailRequest,
  ): Promise<void> {
    await this.sendMail(
      emailRequest.to,
      'Reset Password',
      'reset-password-email-template',
      emailRequest.context,
    );
  }

  async sendContactMeReply(emailRequest: EmailRequest): Promise<void> {
    await this.sendMail(
      emailRequest.to,
      "Welcome to Verrify! Let's Secure Your Property Investment",
      'contact-respond-email-template',
      emailRequest.context,
      undefined,
      'Ifunanya from Verrify',
    );
  }

  async sendContactMeAdminRequest(emailRequest: EmailRequest): Promise<void> {
    await this.sendMail(
      emailRequest.to,
      'Contact Me Message',
      'contact-admin-email-template',
      emailRequest.context,
    );
  }

  async sendCompanyVerifiedMail(emailRequest: EmailRequest): Promise<void> {
    await this.sendMail(
      emailRequest.to,
      '🎉 Company Profile Verified!',
      'company-verified-email-template',
      emailRequest.context,
    );
  }

  async sendCompanyRejectedMail(emailRequest: EmailRequest): Promise<void> {
    await this.sendMail(
      emailRequest.to,
      '⚠️ Company Profile Verification Update',
      'company-rejected-email-template',
      emailRequest.context,
    );
  }

  async sendPropertyVerifiedMail(emailRequest: EmailRequest): Promise<void> {
    await this.sendMail(
      emailRequest.to,
      '🏠 Property Verification Approved!',
      'property-verified-email-template',
      emailRequest.context,
    );
  }

  async sendPropertyRejectedMail(emailRequest: EmailRequest): Promise<void> {
    await this.sendMail(
      emailRequest.to,
      '⚠️ Property Verification Update',
      'property-rejected-email-template',
      emailRequest.context,
    );
  }

  async sendVerificationPipelineUpdateMail(
    emailRequest: EmailRequest,
  ): Promise<void> {
    const { attachments, omitted } = await this.resolveFileAttachments(
      emailRequest.attachmentFileIds || [],
    );
    emailRequest.context.attachmentsOmitted = omitted;

    await this.sendMail(
      emailRequest.to,
      emailRequest.subject || 'Property Verification Update',
      emailRequest.template || 'verification-pipeline-update-email-template',
      emailRequest.context,
      attachments,
    );
  }

  private async resolveFileAttachments(fileIds: string[]): Promise<{
    attachments: Array<{ filename: string; path: string }> | undefined;
    omitted: boolean;
  }> {
    if (fileIds.length === 0) {
      return { attachments: undefined, omitted: false };
    }

    const files = await this.fileService.findFilesByIds(fileIds);
    if (files.some((file) => file.size === null)) {
      this.logger.warn(
        'Email attachments omitted because one or more legacy files have unknown sizes',
        EmailService.name,
      );
      return { attachments: undefined, omitted: true };
    }

    const encodedAttachmentBytes = files.reduce(
      (total, file) => total + 4 * Math.ceil((file.size || 0) / 3),
      0,
    );
    if (
      encodedAttachmentBytes + EMAIL_BODY_ALLOWANCE_BYTES >
      MAX_EMAIL_SIZE_BYTES
    ) {
      this.logger.warn(
        'Email attachments omitted because the message would exceed 40 MB',
        EmailService.name,
      );
      return { attachments: undefined, omitted: true };
    }

    const attachments = await Promise.all(
      files.map(async (file) => ({
        filename: file.originalFileName || file.fileName,
        path: (await this.fileService.resolveAccessUrl(file)).url,
      })),
    );
    return { attachments, omitted: false };
  }

  async sendPaymentReceiptMail(emailRequest: EmailRequest): Promise<void> {
    await this.sendMail(
      emailRequest.to,
      'Payment Receipt - Verrify',
      'payment-receipt-email-template',
      emailRequest.context,
    );
  }
}
