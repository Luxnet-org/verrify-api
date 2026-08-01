import { Injectable } from '@nestjs/common';
import { PaymentCategory } from '../../../model/enum/payment-category.enum';
import { PaymentVerificationHandler } from './payment-verification.handler';
import { PropertyVerificationPaymentHandler } from './property-verification-payment.handler';

@Injectable()
export class PaymentVerificationHandlerRegistry {
  private readonly handlers: Map<PaymentCategory, PaymentVerificationHandler>;

  constructor(propertyHandler: PropertyVerificationPaymentHandler) {
    this.handlers = new Map([[propertyHandler.category, propertyHandler]]);
  }

  get(category: PaymentCategory): PaymentVerificationHandler | undefined {
    return this.handlers.get(category);
  }
}
