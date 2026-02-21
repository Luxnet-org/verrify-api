import {
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequireRoles } from '../common/decorator/role.decorator';
import { SwaggerApiResponseData } from '../common/decorator/swagger.decorator';
import { AuthGuard } from '../common/guards/auth.guard';
import { RoleGuard } from '../common/guards/role.guard';
import { UserRole } from '../model/enum/role.enum';
import { OrderStatus } from '../model/enum/order-status.enum';
import { TransactionStatus } from '../model/enum/transaction-status.enum';
import { Order } from '../model/entity/order.entity';
import { Transaction } from '../model/entity/transaction.entity';
import { OrderService } from '../service/payment/order.service';
import { TransactionService } from '../service/payment/transaction.service';
import { ApiResponse } from '../utility/api-response';
import { PaginationAndSortingResult, PaginationQueryDto } from '../utility/pagination-and-sorting';

@ApiTags('Admin Payment API')
@Controller('admin/payment')
export class AdminPaymentController {
    constructor(
        private readonly orderService: OrderService,
        private readonly transactionService: TransactionService,
    ) { }

    @ApiBearerAuth()

    @RequireRoles(UserRole.ADMIN)
    @Get('orders')
    @ApiOperation({ summary: 'List all orders (Admin)' })
    @SwaggerApiResponseData({ type: 'object', status: HttpStatus.OK })
    @HttpCode(HttpStatus.OK)
    async getAdminOrders(
        @Query() queryDto: PaginationQueryDto,
        @Query('status') status?: OrderStatus,
        @Query('userId') userId?: string,
    ): Promise<ApiResponse<PaginationAndSortingResult<Order>>> {
        const result = await this.orderService.getAdminOrders(queryDto, status, userId);
        return ApiResponse.success(result, HttpStatus.OK);
    }

    @ApiBearerAuth()

    @RequireRoles(UserRole.ADMIN)
    @Get('transactions')
    @ApiOperation({ summary: 'List all transactions (Admin)' })
    @SwaggerApiResponseData({ type: 'object', status: HttpStatus.OK })
    @HttpCode(HttpStatus.OK)
    async getAdminTransactions(
        @Query() queryDto: PaginationQueryDto,
        @Query('status') status?: TransactionStatus,
        @Query('orderId') orderId?: string,
        @Query('search') search?: string,
    ): Promise<ApiResponse<PaginationAndSortingResult<Transaction>>> {
        const result = await this.transactionService.getAdminTransactions(queryDto, status, orderId, search);
        return ApiResponse.success(result, HttpStatus.OK);
    }
}
