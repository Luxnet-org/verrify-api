import { Order } from '../entity/order.entity';

export interface PaystackInitializationDetailsDto {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export class PaymentInitializationResultDto {
  paystackDetails: PaystackInitializationDetailsDto;

  order: Order;

  propertyVerification: Order['propertyVerification'];
}
