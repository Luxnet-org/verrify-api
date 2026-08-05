export class PaystackResponseDto<T> {
  status?: boolean;

  message?: string;

  data?: T;
}
