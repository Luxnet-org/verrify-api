import { ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ContactUsService } from 'src/service/contact-us/contact-us.service';
import { SubscribeNewsletterRequestDto } from '../model/request/subscribe-newsletter-request.dto';
import { Public } from '../common/decorator/public.decorator';
import { ApiResponse } from '../utility/api-response';
import { SwaggerApiResponseData } from '../common/decorator/swagger.decorator';
import { ContactUsRequestDto } from '../model/request/contact-us-request.dto';

@ApiTags('Contact Us API')
@Controller('contact-us')
export class ContactUsController {
  constructor(private readonly contactUsService: ContactUsService) {}

  @Public()
  @Post('newsletter')
  @SwaggerApiResponseData({
    type: 'string',
    status: HttpStatus.OK,
  })
  @HttpCode(HttpStatus.OK)
  async subscriberNewsLetter(
    @Body() request: SubscribeNewsletterRequestDto,
  ): Promise<ApiResponse<string>> {
    const response = await this.contactUsService.subscribeRequest(request);
    return ApiResponse.success(response, HttpStatus.OK);
  }

  @Public()
  @Post('request')
  @SwaggerApiResponseData({
    type: 'string',
    status: HttpStatus.OK,
  })
  @HttpCode(HttpStatus.OK)
  async contactRequest(
    @Body() request: ContactUsRequestDto,
  ): Promise<ApiResponse<string>> {
    const response = await this.contactUsService.contactRequest(request);
    return ApiResponse.success(response, HttpStatus.OK);
  }
}
