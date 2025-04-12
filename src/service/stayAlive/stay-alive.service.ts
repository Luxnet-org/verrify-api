import { Injectable } from '@nestjs/common';
import { MyLoggerService } from '../logger/my-logger.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { ConfigInterface } from '../../config-module/configuration';
import { DateUtility } from '../../utility/date-utility';
import { HttpService } from '@nestjs/axios';
import { catchError } from 'rxjs';

@Injectable()
export class StayAlive {
  private readonly logger: MyLoggerService = new MyLoggerService(
    StayAlive.name,
  );

  constructor(
    private readonly configService: ConfigService<ConfigInterface>,
    private readonly httpService: HttpService,
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async pingServer(): Promise<void> {
    try {
      const origin: string = this.configService.get('app.origin', {
        infer: true,
      })!;

      const reponse = await this.httpService.axiosRef.get(origin);

      this.logger.log(
        `Reloaded at ${new Date().toISOString()}}. Status: ${reponse.status}`,
      );
    } catch (error) {
      this.logger.error(
        `Error reloading at ${DateUtility.currentDate.toISOString()}: ${error.message}`,
        StayAlive.name,
      );
    }
  }
}
