import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Query,
    Req,
    Headers,
    UseGuards,
    UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { RequireRoles } from '../common/decorator/role.decorator';
import { SwaggerApiResponseData } from '../common/decorator/swagger.decorator';
import { AuthGuard, UserInfo } from '../common/guards/auth.guard';
import { RoleGuard } from '../common/guards/role.guard';
import { Order } from '../model/entity/order.entity';
import { Transaction } from '../model/entity/transaction.entity';
import { UserRole } from '../model/enum/role.enum';
import { OrderService } from '../service/payment/order.service';
import { TransactionService } from '../service/payment/transaction.service';
import { ApiResponse } from '../utility/api-response';
import { PaginationAndSortingResult, PaginationQueryDto } from '../utility/pagination-and-sorting';
import { Public } from 'src/common/decorator/public.decorator';

@ApiTags('Payment API')
@Controller('payment')
export class PaymentController {
    constructor(
        private readonly orderService: OrderService,
        private readonly transactionService: TransactionService,
    ) { }

    @ApiBearerAuth()

    @RequireRoles(UserRole.USER)
    @Post('initialize/verification/:verificationId')
    @ApiOperation({ summary: 'Create an Order and initialize a Paystack transaction for property verification' })
    @SwaggerApiResponseData({ type: 'object', status: HttpStatus.OK })
    @HttpCode(HttpStatus.OK)
    async initializePayment(
        @Param('verificationId') verificationId: string,
        @Req() request: Request,
    ): Promise<ApiResponse<any>> {
        const user: UserInfo = request.user!;
        // 1. Create flat fee order
        const order = await this.orderService.createVerificationOrder(verificationId, user.userId);
        // 2. Initialize paystack and create Transaction
        const paystackResult = await this.transactionService.initializeTransaction(order.id);

        return ApiResponse.success({
            paystackDetails: paystackResult,
            order,
            propertyVerification: order.propertyVerification,
        }, HttpStatus.OK);
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
    @Get('my-transactions')
    @ApiOperation({ summary: 'List user transactions' })
    @SwaggerApiResponseData({ type: 'object', status: HttpStatus.OK })
    @HttpCode(HttpStatus.OK)
    async getMyTransactions(
        @Query() queryDto: PaginationQueryDto,
        @Req() request: Request,
    ): Promise<ApiResponse<PaginationAndSortingResult<Transaction>>> {
        const user: UserInfo = request.user!;
        const result = await this.transactionService.getMyTransactions(user.userId, queryDto);
        return ApiResponse.success(result, HttpStatus.OK);
    }

    @Public()
    @Post('webhook')
    @ApiOperation({ summary: 'Paystack webhook receiver' })
    @HttpCode(HttpStatus.OK)
    async handleWebhook(
        @Headers('x-paystack-signature') signature: string,
        @Body() body: any,
    ): Promise<void> {
        if (!signature) {
            throw new UnauthorizedException('Missing signature');
        }

        const isValid = this.transactionService.validateWebhookSignature(signature, body);
        if (!isValid) {
            throw new UnauthorizedException('Invalid signature');
        }

        // Process event asynchronously or block. Simple blocking for now.
        await this.transactionService.handleWebhook(body);
    }
}
