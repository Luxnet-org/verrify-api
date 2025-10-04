import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { JWT } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';
import { ConfigInterface } from '../../config-module/configuration';
import { google } from 'googleapis';
import { SubscribeNewsletterRequestDto } from '../../model/request/subscribe-newsletter-request.dto';
import { DateUtility } from '../../utility/date-utility';
import { MyLoggerService } from '../logger/my-logger.service';

@Injectable()
export class NewsletterService {
  private readonly logger: MyLoggerService = new MyLoggerService(
    NewsletterService.name,
  );
  private sheets;
  private auth: JWT;

  constructor(private readonly configService: ConfigService<ConfigInterface>) {
    this.initializeGoogleSheets();
  }

  private initializeGoogleSheets() {
    // Initialize auth with service account
    this.auth = new JWT({
      email: this.configService.get('google.clientMail', {
        infer: true,
      }),
      key: this.configService
        .get('google.privateKey', {
          infer: true,
        })
        ?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
  }

  async subscribe(request: SubscribeNewsletterRequestDto): Promise<void> {
    try {
      const spreadsheetId = this.configService.get('google.sheetsId', {
        infer: true,
      })!;
      const sheetsName = this.configService.get('google.sheetsName', {
        infer: true,
      })!;

      const formattedSheetName =
        sheetsName.includes(' ') || sheetsName.includes('!')
          ? `'${sheetsName}'`
          : sheetsName;

      const range = `${formattedSheetName}!A:C`;
      const emailColumnRange = `${formattedSheetName}!A:A`;

      const emailExists = await this.checkEmailExists(
        spreadsheetId,
        emailColumnRange,
        request.email,
      );

      if (emailExists) {
        this.logger.warn(
          `Duplicate subscription attempt for email: ${request.email}`,
          NewsletterService.name,
        );
        throw new ConflictException(
          'This email is already subscribed to the newsletter.',
        );
      }

      const timestamp = DateUtility.currentDate.toISOString();
      const values = [[request.email, request.name || '', timestamp]];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values,
        },
      });

      this.logger.log(
        `Successfully subscribed email: ${request.email} to newsletter`,
        NewsletterService.name,
      );
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }

      this.logger.error(
        'Error appending to Google Sheet:',
        NewsletterService.name,
      );
      throw new InternalServerErrorException(
        'Failed to subscribe to newsletter',
        error,
      );
    }
  }

  private async checkEmailExists(
    spreadsheetId: string,
    range: string,
    email: string,
  ): Promise<boolean> {
    try {
      // Get all values from column A (emails)
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      const rows = response.data.values;

      if (!rows || rows.length === 0) {
        return false;
      }

      // Check if email exists (case-insensitive comparison)
      const emailLower = email.toLowerCase().trim();
      return rows.some((row) => {
        const existingEmail = row[0]?.toString().toLowerCase().trim();
        return existingEmail === emailLower;
      });
    } catch (error) {
      this.logger.error(
        'Error checking for duplicate email:',
        NewsletterService.name,
      );
      return false;
    }
  }
}
