import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { MyLoggerService} from './service/logger/my-logger.service'
import { Request, Response } from 'express';
import { ApiResponse } from './utility/api-response';
import { TypeORMError } from 'typeorm';

@Catch()
export class AllExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new MyLoggerService(AllExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    let responseStatus: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let responseString: string | object = 'Internal Server Error';

    if (exception instanceof HttpException) {
      responseStatus = exception.getStatus();
      responseString = exception.getResponse();
    } else if (exception instanceof TypeORMError) {
      responseStatus = HttpStatus.BAD_REQUEST;
      responseString = exception.message;
    } else {
      responseStatus = HttpStatus.INTERNAL_SERVER_ERROR;
      responseString = 'Internal Server Error';
    }

    response
      .status(responseStatus)
      .json(ApiResponse.error(responseString, responseStatus));
    this.logger.error(responseString, AllExceptionFilter.name);

    super.catch(exception, host);
  }
}
