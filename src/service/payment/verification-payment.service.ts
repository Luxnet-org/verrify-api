import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PaymentInitializationResultDto } from '../../model/dto/payment-initialization-result.dto';
import { PropertyVerification } from '../../model/entity/property-verification.entity';
import { VerificationStageStatus } from '../../model/enum/verification-stage-status.enum';
import { OrderService } from './order.service';
import { TransactionService } from './transaction.service';

@Injectable()
export class VerificationPaymentService {
  private readonly logger = new Logger(VerificationPaymentService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly orderService: OrderService,
    private readonly transactionService: TransactionService,
  ) {}

  async initialize(
    verificationId: string,
    userId: string,
    packageId: string,
    idempotencyKey: string,
  ): Promise<PaymentInitializationResultDto> {
    const queryRunner = this.dataSource.createQueryRunner();

    let initializedReference: string | null = null;
    let committed = false;

    await queryRunner.connect();

    try {
      await queryRunner.startTransaction();
      const manager = queryRunner.manager;

      await this.transactionService.lockInitializationKey(
        manager,
        idempotencyKey,
      );
      const replay = await this.transactionService.findInitializationReplay(
        manager,
        idempotencyKey,
      );
      if (replay) {
        if (replay.order.user.id !== userId) {
          throw new ConflictException(
            'The idempotency key has already been used by another user',
          );
        }

        await queryRunner.commitTransaction();
        committed = true;
        return {
          paystackDetails:
            this.transactionService.toPaystackInitializationDetails(replay),
          order: replay.order,
          propertyVerification: replay.order.propertyVerification,
        };
      }

      const lockedVerification = await manager.findOne(PropertyVerification, {
        where: { id: verificationId },
        lock: { mode: 'pessimistic_write' },
      });
      const verification = lockedVerification
        ? await manager.findOne(PropertyVerification, {
            where: { id: lockedVerification.id },
            relations: ['user'],
          })
        : null;

      if (!verification || verification.user.id !== userId) {
        throw new NotFoundException('Verification request not found');
      }

      if (
        ![
          VerificationStageStatus.VERIFICATION_ACCEPTED,
          VerificationStageStatus.PENDING_PAYMENT,
        ].includes(verification.stage)
      ) {
        throw new BadRequestException(
          'Verification request is not in the correct stage to be paid for',
        );
      }

      const hasSuccessfulPayment =
        await this.transactionService.hasSuccessfulPaymentForVerification(
          manager,
          verificationId,
        );
      const hasPaidOrder = await this.orderService.hasPaidOrderForVerification(
        manager,
        verificationId,
      );
      if (hasSuccessfulPayment || hasPaidOrder) {
        throw new BadRequestException(
          'This property verification has already been paid for',
        );
      }

      let order = await this.orderService.findPendingVerificationOrder(
        manager,
        verificationId,
      );

      if (order && order.verificationPackage?.id !== packageId) {
        await this.orderService.cancelPendingOrder(manager, order.id);

        const paymentCompletedDuringSuperseding =
          (await this.transactionService.hasSuccessfulPaymentForVerification(
            manager,
            verificationId,
          )) ||
          (await this.orderService.hasPaidOrderForVerification(
            manager,
            verificationId,
          ));
        if (paymentCompletedDuringSuperseding) {
          throw new BadRequestException(
            'This property verification was paid while the previous payment was being superseded',
          );
        }
        order = null;
      }

      if (
        order &&
        (await this.transactionService.hasPendingTransactionForOrder(
          manager,
          order.id,
        ))
      ) {
        throw new BadRequestException(
          'A payment transaction is already pending for this verification package',
        );
      }

      order ??= await this.orderService.createVerificationOrder(
        verificationId,
        userId,
        packageId,
        manager,
      );

      const initialization =
        await this.transactionService.initializeTransaction(
          manager,
          order,
          idempotencyKey,
        );
      initializedReference = initialization.transaction.paystackReference;

      await queryRunner.commitTransaction();
      committed = true;

      return {
        paystackDetails: initialization.paystackDetails,
        order,
        propertyVerification: order.propertyVerification,
      };
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      if (initializedReference && !committed) {
        this.logger.error(
          `Paystack reference ${initializedReference} was initialized but the local database transaction did not commit`,
        );
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
