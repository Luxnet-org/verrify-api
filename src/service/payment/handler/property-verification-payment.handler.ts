import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { PropertyVerification } from '../../../model/entity/property-verification.entity';
import { Transaction } from '../../../model/entity/transaction.entity';
import { PaymentCategory } from '../../../model/enum/payment-category.enum';
import { VerificationStageStatus } from '../../../model/enum/verification-stage-status.enum';
import AppConstants from '../../../utility/app-constants';
import { generateAvailableDomainIdentifier } from '../../../utility/domain-identifier';
import { PaymentVerificationHandler } from './payment-verification.handler';

@Injectable()
export class PropertyVerificationPaymentHandler
  implements PaymentVerificationHandler
{
  readonly category = PaymentCategory.PROPERTY_VERIFICATION;

  async handle(
    manager: EntityManager,
    transaction: Transaction,
  ): Promise<void> {
    const verification = transaction.order?.propertyVerification;
    if (!verification) {
      throw new Error(
        `Property verification is missing for transaction ${transaction.id}`,
      );
    }

    if (verification.stage !== VerificationStageStatus.PAYMENT_VERIFIED) {
      verification.stage = VerificationStageStatus.PAYMENT_VERIFIED;
      verification.stageHistory ??= [];
      verification.stageHistory.push({
        stage: VerificationStageStatus.PAYMENT_VERIFIED,
        completedAt: new Date(),
      });
    }

    if (!verification.caseId) {
      verification.caseId = await generateAvailableDomainIdentifier(
        AppConstants.VERIFICATION_CASE_ID_PREFIX,
        (candidate) =>
          manager.exists(PropertyVerification, {
            where: { caseId: candidate },
            withDeleted: true,
          }),
      );
    }

    await manager.save(verification);
  }
}
