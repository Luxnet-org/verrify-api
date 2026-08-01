import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  FindOptionsWhere,
  Repository,
} from 'typeorm';
import { ConfigInterface } from '../../config-module/configuration';
import { Transaction } from '../../model/entity/transaction.entity';
import { WebhookEvent } from '../../model/entity/webhook-event.entity';
import { PaystackVerificationDataDto } from '../../model/dto/paystack-verification-data.dto';
import { PaystackVerificationResultDto } from '../../model/dto/paystack-verification-result.dto';
import { OrderPaymentTransitionResultDto } from '../../model/dto/order-payment-transition-result.dto';
import { PaymentCategory } from '../../model/enum/payment-category.enum';
import { TransactionStatus } from '../../model/enum/transaction-status.enum';
import { EmailType } from '../../model/enum/email-type.enum';
import { EmailRequest } from '../../model/request/email-request.dto';
import { PaymentWebhookProcessingResponseDto } from '../../model/response/payment-webhook-processing-response.dto';
import {
  PaginationAndSorting,
  PaginationAndSortingResult,
  PaginationQueryDto,
} from '../../utility/pagination-and-sorting';
import { majorToMinorUnits } from '../../utility/money';
import {
  extractPaystackMetadataOrderId,
  extractPaystackWebhookReference,
} from '../../utility/paystack-utility';
import { PaymentVerificationHandlerRegistry } from './handler/payment-verification-handler.registry';
import { PaystackService } from './paystack/paystack.service';
import { RetryablePaymentVerificationError } from '../../exception/retryable-payment.exception';
import { InvalidOrderPaymentStateError } from '../../exception/invalid-order-payment-state.exception';
import { OrderService } from './order.service';
import { Order } from '../../model/entity/order.entity';
import { PaystackInitializationDetailsDto } from '../../model/dto/payment-initialization-result.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly orderService: OrderService,
    private readonly configService: ConfigService<ConfigInterface>,
    private readonly dataSource: DataSource,
    private readonly handlerRegistry: PaymentVerificationHandlerRegistry,
    private readonly paystackService: PaystackService,
  ) {}

  async initializeTransaction(
    manager: EntityManager,
    order: Order,
    idempotencyKey: string,
  ): Promise<{
    transaction: Transaction;
    paystackDetails: PaystackInitializationDetailsDto;
  }> {
    const reference = `VPP${randomUUID().replaceAll('-', '')}`;
    try {
      const data = await this.paystackService.initializeTransaction({
        email: order.user.email,
        amount: Number(majorToMinorUnits(order.amount)),
        currency: order.currency,
        orderId: order.id,
        reference,
      });
      const transaction = manager.create(Transaction, {
        amount: order.amount,
        currency: order.currency,
        paymentCategory: PaymentCategory.PROPERTY_VERIFICATION,
        paystackReference: reference,
        authorizationUrl: data.authorization_url,
        accessCode: data.access_code,
        idempotencyKey,
        providerTransactionId: null,
        failureReason: null,
        status: TransactionStatus.PENDING,
        order,
      });
      await manager.save(transaction);

      return {
        transaction,
        paystackDetails: this.toPaystackInitializationDetails(transaction),
      };
    } catch (error) {
      this.logger.error(
        `Failed to initialize Paystack transaction for order ${order.id}: ${this.errorMessage(error)}`,
      );
      throw new InternalServerErrorException(
        'Failed to initialize Paystack transaction',
      );
    }
  }

  async findInitializationReplay(
    manager: EntityManager,
    idempotencyKey: string,
  ): Promise<Transaction | null> {
    return manager.findOne(Transaction, {
      where: { idempotencyKey },
      relations: [
        'order',
        'order.user',
        'order.propertyVerification',
        'order.propertyVerification.user',
        'order.verificationPackage',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async lockInitializationKey(
    manager: EntityManager,
    idempotencyKey: string,
  ): Promise<void> {
    await manager.query(
      'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
      [idempotencyKey],
    );
  }

  async hasSuccessfulPaymentForVerification(
    manager: EntityManager,
    verificationId: string,
  ): Promise<boolean> {
    return manager.exists(Transaction, {
      where: {
        status: TransactionStatus.SUCCESS,
        order: { propertyVerification: { id: verificationId } },
      },
    });
  }

  async hasPendingTransactionForOrder(
    manager: EntityManager,
    orderId: string,
  ): Promise<boolean> {
    return manager.exists(Transaction, {
      where: {
        status: TransactionStatus.PENDING,
        order: { id: orderId },
      },
    });
  }

  toPaystackInitializationDetails(
    transaction: Transaction,
  ): PaystackInitializationDetailsDto {
    return {
      authorization_url: transaction.authorizationUrl,
      access_code: transaction.accessCode || '',
      reference: transaction.paystackReference,
    };
  }

  async processPaystackWebhook(
    webhookEvent: WebhookEvent,
  ): Promise<PaymentWebhookProcessingResponseDto> {
    const reference = extractPaystackWebhookReference(webhookEvent.payload);
    if (!reference) {
      return {
        terminalStatus: 'IGNORED',
        reason: 'Paystack webhook has no transaction reference to verify',
      };
    }

    const providerResult =
      await this.paystackService.verifyTransaction(reference);

    const localTransaction = await this.transactionRepository.findOne({
      where: { paystackReference: reference },
    });

    if (!localTransaction) {
      const providerReason = providerResult.data
        ? `Paystack reference ${reference} verified but no local transaction exists`
        : `No local transaction exists and Paystack verification was rejected: ${providerResult.rejectionReason}`;
      return { terminalStatus: 'IGNORED', reason: providerReason };
    }

    return this.applyVerifiedPayment(reference, providerResult);
  }

  async processPendingTransaction(
    transactionId: string,
  ): Promise<PaymentWebhookProcessingResponseDto> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
    });

    if (!transaction) {
      return {
        terminalStatus: 'IGNORED',
        reason: `Local transaction ${transactionId} no longer exists`,
      };
    }

    if (transaction.status !== TransactionStatus.PENDING) {
      return {
        terminalStatus: 'PROCESSED',
        reason: `Transaction ${transaction.paystackReference} is already ${transaction.status}`,
      };
    }

    const providerResult = await this.paystackService.verifyTransaction(
      transaction.paystackReference,
    );
    return this.applyVerifiedPayment(
      transaction.paystackReference,
      providerResult,
    );
  }

  async getMyTransactions(
    userId: string,
    queryDto: PaginationQueryDto,
  ): Promise<PaginationAndSortingResult<Transaction>> {
    const findOptions = PaginationAndSorting.createFindOptions<Transaction>(
      null,
      queryDto,
      { order: { user: { id: userId } } } as FindOptionsWhere<Transaction>,
      {},
      ['order'],
    );
    const [items, total] =
      await this.transactionRepository.findAndCount(findOptions);
    return PaginationAndSorting.getPaginateResult(
      items,
      total,
      queryDto,
      (item: Transaction) => item,
    );
  }

  async getAdminTransactions(
    queryDto: PaginationQueryDto,
    status?: TransactionStatus,
    orderId?: string,
    search?: string,
  ): Promise<PaginationAndSortingResult<Transaction>> {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (orderId) where.order = { id: orderId };

    let customQuery = this.transactionRepository
      .createQueryBuilder('tx')
      .leftJoinAndSelect('tx.order', 'order')
      .leftJoinAndSelect('order.user', 'user')
      .where(where);

    if (search) {
      customQuery = customQuery.andWhere('tx.paystackReference ILIKE :search', {
        search: `%${search}%`,
      });
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
      (item: Transaction) => item,
    );
  }

  private async applyVerifiedPayment(
    reference: string,
    providerResult: PaystackVerificationResultDto,
  ): Promise<PaymentWebhookProcessingResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const locked = await manager.findOne(Transaction, {
        where: { paystackReference: reference },
        lock: { mode: 'pessimistic_write' },
      });
      if (!locked) {
        return {
          terminalStatus: 'IGNORED',
          reason: `Local transaction for ${reference} disappeared after provider verification`,
        };
      }

      const transaction = await manager.findOneOrFail(Transaction, {
        where: { id: locked.id },
        relations: ['order', 'order.user', 'order.propertyVerification'],
      });

      if (transaction.status === TransactionStatus.SUCCESS) {
        return {
          terminalStatus: 'PROCESSED',
          reason: `Transaction ${reference} was already processed successfully`,
        };
      }

      if (!providerResult.data) {
        return this.recordValidationMismatch(
          manager,
          transaction,
          providerResult.rejectionReason ||
            'Paystack verification was rejected',
        );
      }

      const data = providerResult.data;
      transaction.providerTransactionId = data.id ?? null;
      const mismatch = this.validationMismatch(transaction, data);
      if (mismatch) {
        return this.recordValidationMismatch(manager, transaction, mismatch);
      }

      const providerStatus = data.status;
      if (['pending', 'processing', 'ongoing'].includes(providerStatus || '')) {
        throw new RetryablePaymentVerificationError(
          `Paystack transaction ${reference} is still ${providerStatus}`,
        );
      }

      if (['failed', 'abandoned', 'reversed'].includes(providerStatus || '')) {
        transaction.status = TransactionStatus.FAILED;
        transaction.failureReason = `Paystack transaction status is ${providerStatus}`;
        await manager.save(transaction);
        return {
          terminalStatus: 'PROCESSED',
          reason: transaction.failureReason,
        };
      }

      if (providerStatus !== 'success') {
        throw new RetryablePaymentVerificationError(
          `Paystack returned unsupported transaction status: ${providerStatus || 'missing'}`,
        );
      }

      const handler = this.handlerRegistry.get(transaction.paymentCategory);
      if (!handler) {
        return this.recordValidationMismatch(
          manager,
          transaction,
          `No payment handler is registered for ${transaction.paymentCategory}`,
        );
      }

      let orderTransition: OrderPaymentTransitionResultDto;
      try {
        orderTransition = await this.orderService.markPaid(
          manager,
          transaction.order.id,
        );
      } catch (error) {
        if (error instanceof InvalidOrderPaymentStateError) {
          return this.recordValidationMismatch(
            manager,
            transaction,
            error.message,
          );
        }
        throw error;
      }

      if (!orderTransition.transitioned) {
        return this.recordValidationMismatch(
          manager,
          transaction,
          `Order ${orderTransition.order.id} is already paid and requires manual payment review`,
        );
      }

      transaction.status = TransactionStatus.SUCCESS;
      transaction.failureReason = null;
      await manager.save(transaction);
      await handler.handle(manager, transaction);

      return {
        terminalStatus: 'PROCESSED',
        reason: `Paystack transaction ${reference} verified successfully`,
        receipt: this.buildReceipt(transaction),
      };
    });
  }

  private async recordValidationMismatch(
    manager: EntityManager,
    transaction: Transaction,
    reason: string,
  ): Promise<PaymentWebhookProcessingResponseDto> {
    transaction.status = TransactionStatus.PENDING;
    transaction.failureReason = reason;
    await manager.save(transaction);
    return { terminalStatus: 'PROCESSED', reason };
  }

  private validationMismatch(
    transaction: Transaction,
    data: PaystackVerificationDataDto,
  ): string | null {
    const order = transaction.order;
    if (!order) {
      return `Local transaction ${transaction.id} has no order`;
    }

    if (data.reference !== transaction.paystackReference) {
      return 'Paystack reference does not match the local transaction reference';
    }

    const transactionAmount = majorToMinorUnits(transaction.amount);
    const orderAmount = majorToMinorUnits(order.amount);
    if (data.amount !== transactionAmount || data.amount !== orderAmount) {
      return 'Paystack amount does not match the local transaction and order amounts';
    }

    const currency = data.currency?.toUpperCase();
    if (
      currency !== transaction.currency.toUpperCase() ||
      currency !== order.currency.toUpperCase()
    ) {
      return 'Paystack currency does not match the local transaction and order currencies';
    }

    if (extractPaystackMetadataOrderId(data.metadata) !== order.id) {
      return 'Paystack metadata orderId does not match the local order ID';
    }

    return null;
  }

  private buildReceipt(transaction: Transaction): EmailRequest | undefined {
    const user = transaction.order?.user;
    if (!user?.email) return undefined;

    const appConfig = this.configService.get('app', { infer: true });
    const frontendUrl = appConfig?.frontendHost || 'https://verrify.net';
    const amountFormatted = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: transaction.currency,
    }).format(transaction.amount);

    return {
      type: EmailType.PAYMENT_RECEIPT,
      to: user.email,
      context: {
        firstName: user.firstName,
        orderId: transaction.order.id,
        reference: transaction.paystackReference,
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        description: `Payment for Order ${transaction.order.id}`,
        amountFormatted,
        dashboardUrl: `${frontendUrl}/user/dashboard/transactions`,
      },
    };
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
