import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  RawBodyRequest,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { RequireRoles } from '../common/decorator/role.decorator';
import { SwaggerApiResponseData } from '../common/decorator/swagger.decorator';
import { UserInfo } from '../common/guards/auth.guard';
import { Order } from '../model/entity/order.entity';
import { Transaction } from '../model/entity/transaction.entity';
import { UserRole } from '../model/enum/role.enum';
import { OrderService } from '../service/payment/order.service';
import { TransactionService } from '../service/payment/transaction.service';
import { VerificationPaymentService } from '../service/payment/verification-payment.service';
import { WebhookService } from '../service/webhook/webhook.service';
import { ApiResponse } from '../utility/api-response';
import {
  PaginationAndSortingResult,
  PaginationQueryDto,
} from '../utility/pagination-and-sorting';
import { Public } from 'src/common/decorator/public.decorator';
import { InitializePaymentRequestDto } from '../model/request/initialize-payment-request.dto';

@ApiTags('Payment API')
@Controller('payment')
export class PaymentController {
  constructor(
    private readonly orderService: OrderService,
    private readonly transactionService: TransactionService,
    private readonly verificationPaymentService: VerificationPaymentService,
    private readonly webhookService: WebhookService,
  ) {}

  @ApiBearerAuth()
  @RequireRoles(UserRole.USER)
  @Post('initialize/verification/:verificationId')
  @ApiOperation({
    summary:
      'Create an Order and initialize a Paystack transaction for property verification',
  })
  @SwaggerApiResponseData({ type: 'object', status: HttpStatus.OK })
  @HttpCode(HttpStatus.OK)
  async initializeVerificationPayment(
    @Param('verificationId') verificationId: string,
    @Body() body: InitializePaymentRequestDto,
    @Req() request: Request,
  ): Promise<ApiResponse<unknown>> {
    const user: UserInfo = request.user!;
    const result = await this.verificationPaymentService.initialize(
      verificationId,
      user.userId,
      body.packageId,
      body.idempotencyKey,
    );

    return ApiResponse.success(result, HttpStatus.OK);
  }

  @ApiBearerAuth()
  @RequireRoles(UserRole.USER)
  @Get('my-orders')
  @ApiOperation({ summary: 'List user orders' })
  @SwaggerApiResponseData({ type: 'object', status: HttpStatus.OK })
  @HttpCode(HttpStatus.OK)
  async getMyOrders(
    @Query() queryDto: PaginationQueryDto,
    @Req() request: Request,
  ): Promise<ApiResponse<PaginationAndSortingResult<Order>>> {
    const user: UserInfo = request.user!;
    const result = await this.orderService.getMyOrders(user.userId, queryDto);
    return ApiResponse.success(result, HttpStatus.OK);
  }

  @ApiBearerAuth()
  @RequireRoles(UserRole.USER)
  @Get('order/verification/:verificationId')
  @ApiOperation({ summary: 'Get order details for a property verification' })
  @SwaggerApiResponseData({ type: 'object', status: HttpStatus.OK })
  @HttpCode(HttpStatus.OK)
  async getOrderForVerification(
    @Param('verificationId') verificationId: string,
    @Req() request: Request,
  ): Promise<ApiResponse<unknown>> {
    const user: UserInfo = request.user!;
    const result: unknown = await this.orderService.getOrderForVerification(
      verificationId,
      user.userId,
    );
    return ApiResponse.success(result, HttpStatus.OK);
  }

  @ApiBearerAuth()
  @RequireRoles(UserRole.USER)
  @Get('my-transactions')
  @ApiOperation({ summary: 'List user transactions' })
  @SwaggerApiResponseData({ type: 'object', status: HttpStatus.OK })
  @HttpCode(HttpStatus.OK)
  async getMyTransactions(
    @Query() queryDto: PaginationQueryDto,
    @Req() request: Request,
  ): Promise<ApiResponse<PaginationAndSortingResult<Transaction>>> {
    const user: UserInfo = request.user!;
    const result = await this.transactionService.getMyTransactions(
      user.userId,
      queryDto,
    );
    return ApiResponse.success(result, HttpStatus.OK);
  }

  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Paystack webhook receiver' })
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers('x-paystack-signature') signature: string | undefined,
    @Req() request: RawBodyRequest<Request>,
  ): Promise<void> {
    if (!signature) {
      throw new UnauthorizedException('Missing signature');
    }
    if (!request.rawBody) {
      throw new BadRequestException('Raw webhook body is unavailable');
    }
    if (!request.ip) {
      throw new UnauthorizedException('Webhook source IP is unavailable');
    }

    await this.webhookService.receivePaystackWebhook(
      request.rawBody,
      signature,
      request.ip,
    );
  }
}
