import { OrderStatus } from '../model/enum/order-status.enum';

export class InvalidOrderPaymentStateError extends Error {
  constructor(
    public readonly orderId: string,
    public readonly orderStatus: OrderStatus,
  ) {
    super(
      `Order ${orderId} is ${orderStatus} and requires manual payment review`,
    );
    this.name = InvalidOrderPaymentStateError.name;
  }
}
