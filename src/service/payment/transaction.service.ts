import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import { ConfigInterface } from '../../config-module/configuration';
import { Transaction } from '../../model/entity/transaction.entity';
import { Order } from '../../model/entity/order.entity';
import { PropertyVerification } from '../../model/entity/property-verification.entity';
import { TransactionStatus } from '../../model/enum/transaction-status.enum';
import { OrderStatus } from '../../model/enum/order-status.enum';
import { VerificationStageStatus } from '../../model/enum/verification-stage-status.enum';
import { EmailEvent } from '../email/email-event.service';
import { EmailType } from '../../model/enum/email-type.enum';
import { PaginationAndSorting, PaginationQueryDto, PaginationAndSortingResult } from '../../utility/pagination-and-sorting';

@Injectable()
export class TransactionService {
    private readonly paystackSecretKey: string;
    private readonly paystackPublicKey: string;

    constructor(
        @InjectRepository(Transaction)
        private readonly transactionRepository: Repository<Transaction>,
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
        @InjectRepository(PropertyVerification)
        private readonly propertyVerificationRepository: Repository<PropertyVerification>,
        private readonly httpService: HttpService,
        private readonly configService: ConfigService<ConfigInterface>,
        private readonly dataSource: DataSource,
        private readonly emailEvent: EmailEvent,
    ) {
        const paystackConfig = this.configService.get('paystack', { infer: true });
        if (!paystackConfig) {
            throw new Error('Paystack configuration is missing');
        }
        this.paystackSecretKey = paystackConfig.secretKey;
        this.paystackPublicKey = paystackConfig.publicKey;
    }

    async initializeTransaction(orderId: string): Promise<any> {
        const order = await this.orderRepository.findOne({
            where: { id: orderId },
            relations: ['user']
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        if (order.status !== OrderStatus.PENDING) {
            throw new BadRequestException('Order is not in a pending state');
        }

        const userEmail = order.user.email;
        const amountInKobo = Math.round(order.amount * 100);

        try {
            const response = await firstValueFrom(
                this.httpService.post(
                    'https://api.paystack.co/transaction/initialize',
                    {
                        email: userEmail,
                        amount: amountInKobo,
                        metadata: {
                            orderId: order.id,
                        },
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${this.paystackSecretKey}`,
                            'Content-Type': 'application/json',
                        },
                    }
                )
            );

            const data = response.data.data;

            // Create Transaction record mapped to this Order
            const transaction = this.transactionRepository.create({
                amount: order.amount,
                paystackReference: data.reference,
                status: TransactionStatus.PENDING,
                order,
            });

            await this.transactionRepository.save(transaction);

            return data; // contains authorization_url, access_code, reference
        } catch (error) {
            throw new InternalServerErrorException('Failed to initialize Paystack transaction');
        }
    }

    validateWebhookSignature(signature: string, body: any): boolean {
        // Warning: In production, it is safer to use raw body buffer to compute HMAC. 
        // JSON.stringify order may not strictly match the original payload bytes.
        const hash = crypto.createHmac('sha512', this.paystackSecretKey).update(JSON.stringify(body)).digest('hex');
        return hash === signature;
    }

    async handleWebhook(event: any): Promise<void> {
        if (event.event !== 'charge.success') {
            return; // We only care about successful charges for now
        }

        const reference = event.data.reference;

        await this.dataSource.transaction(async (manager) => {
            // First, find and lock the transaction record without relations
            // This prevents Postgres "FOR UPDATE cannot be applied to the nullable side of an outer join" error
            const lockedTransaction = await manager.findOne(Transaction, {
                where: { paystackReference: reference },
                lock: { mode: 'pessimistic_write' }
            });

            if (!lockedTransaction) {
                // Transaction might not have been created by our backend (e.g. from dashboard directly)
                return;
            }

            if (lockedTransaction.status === TransactionStatus.SUCCESS) {
                // Idempotency: Ignore already processed transactions
                return;
            }

            // Now, safely fetch the transaction with its outer relations
            const transaction = await manager.findOne(Transaction, {
                where: { id: lockedTransaction.id },
                relations: ['user', 'order', 'order.propertyVerification']
            });

            if (!transaction) {
                // Transaction might not have been created by our backend (e.g. from dashboard directly)
                return;
            }

            if (transaction.status === TransactionStatus.SUCCESS) {
                // Idempotency: Ignore already processed transactions
                return;
            }

            transaction.status = TransactionStatus.SUCCESS;
            await manager.save(transaction);

            const order = transaction.order;
            if (order && order.status !== OrderStatus.PAID) {
                order.status = OrderStatus.PAID;
                await manager.save(order);

                const verification = order.propertyVerification;
                if (verification) {
                    verification.stage = VerificationStageStatus.PAYMENT_VERIFIED;
                    // Generate Unique Case ID
                    verification.caseId = await this.generateCaseId(manager);
                    await manager.save(verification);
                }
            }

            // Send receipt email outside of inner order checking, but only when transaction marks itself success correctly
            if (transaction.order && transaction.order.user && transaction.order.user.email) {
                const appConfig = this.configService.get('app', { infer: true });
                const frontendUrl = appConfig?.frontendHost || 'https://verrify.net';

                const formattedAmount = new Intl.NumberFormat('en-NG', {
                    style: 'currency',
                    currency: 'NGN',
                }).format(transaction.amount);

                await this.emailEvent.sendEmailRequest({
                    type: EmailType.PAYMENT_RECEIPT,
                    to: transaction.order.user.email,
                    context: {
                        firstName: transaction.order.user.firstName,
                        orderId: transaction.order?.id || 'N/A',
                        reference: transaction.paystackReference,
                        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                        description: `Payment for Order ${transaction.order?.id || 'N/A'}`,
                        amountFormatted: formattedAmount,
                        dashboardUrl: `${frontendUrl}/user/dashboard/transactions`,
                    },
                });
            }
        });
    }

    private async generateCaseId(manager: any): Promise<string> {
        const year = new Date().getFullYear();
        // Query to find the highest case count for the current year
        const result = await manager.createQueryBuilder(PropertyVerification, 'pv')
            .select('MAX(pv.caseId)', 'max')
            .where('pv.caseId LIKE :pattern', { pattern: `VR-${year}-%` })
            .getRawOne();

        let nextNumber = 1;
        if (result && result.max) {
            const parts = result.max.split('-');
            const lastNum = parseInt(parts[2], 10);
            if (!isNaN(lastNum)) {
                nextNumber = lastNum + 1;
            }
        }

        const formattedNumber = nextNumber.toString().padStart(3, '0');
        return `VR-${year}-${formattedNumber}`;
    }

    async getMyTransactions(userId: string, queryDto: PaginationQueryDto): Promise<PaginationAndSortingResult<Transaction>> {
        const findOptions = PaginationAndSorting.createFindOptions<Transaction>(
            null,
            queryDto,
            { order: { user: { id: userId } } } as any,
            {},
            ['order']
        );

        const [items, total] = await this.transactionRepository.findAndCount(findOptions);

        return PaginationAndSorting.getPaginateResult(
            items,
            total,
            queryDto,
            (item: Transaction) => item
        );
    }

    async getAdminTransactions(queryDto: PaginationQueryDto, status?: TransactionStatus, orderId?: string, search?: string): Promise<PaginationAndSortingResult<Transaction>> {
        const where: any = {};
        if (status) where.status = status;
        if (orderId) where.order = { id: orderId };

        let customQuery = this.transactionRepository.createQueryBuilder('tx')
            .leftJoinAndSelect('tx.order', 'order')
            .leftJoinAndSelect('order.user', 'user')
            .where(where);

        if (search) {
            customQuery = customQuery.andWhere('tx.paystackReference ILIKE :search', { search: `%${search}%` });
        }

        const page = queryDto.page || 1;
        const limit = Math.min(queryDto.limit || 10, 50);
        const skip = (page - 1) * limit;

        const sortBy = queryDto.sortBy || 'createdAt';
        const orderVal = queryDto.order || 'DESC';

        customQuery = customQuery
            .orderBy(`tx.${sortBy}`, orderVal)
            .skip(skip)
            .take(limit);

        const [items, total] = await customQuery.getManyAndCount();

        return PaginationAndSorting.getPaginateResult(
            items,
            total,
            queryDto,
            (item: Transaction) => item
        );
    }
}
