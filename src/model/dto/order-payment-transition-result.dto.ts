import { Order } from '../entity/order.entity';

export class OrderPaymentTransitionResultDto {
  order: Order;

  transitioned: boolean;
}
