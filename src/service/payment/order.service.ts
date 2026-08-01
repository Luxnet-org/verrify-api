import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, FindOptionsWhere, Repository } from 'typeorm';
import { InvalidOrderPaymentStateError } from '../../exception/invalid-order-payment-state.exception';
import { OrderPaymentTransitionResultDto } from '../../model/dto/order-payment-transition-result.dto';
import { Order } from '../../model/entity/order.entity';
import { PropertyVerification } from '../../model/entity/property-verification.entity';
import { User } from '../../model/entity/user.entity';
import { VerificationPackage } from '../../model/entity/verification-package.entity';
import { OrderStatus } from '../../model/enum/order-status.enum';
import {
  PaginationAndSorting,
  PaginationQueryDto,
  PaginationAndSortingResult,
} from '../../utility/pagination-and-sorting';
import { VerificationStageStatus } from '../../model/enum/verification-stage-status.enum';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(PropertyVerification)
    private readonly propertyVerificationRepository: Repository<PropertyVerification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(VerificationPackage)
    private readonly packageRepository: Repository<VerificationPackage>,
  ) {}

  async getOrderForPaymentInitialization(orderId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['user'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Order is not in a pending state');
    }

    return order;
  }

  async markPaid(
    manager: EntityManager,
    orderId: string,
  ): Promise<OrderPaymentTransitionResultDto> {
    const order = await manager.findOne(Order, {
      where: { id: orderId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status === OrderStatus.PAID) {
      return { order, transitioned: false };
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new InvalidOrderPaymentStateError(order.id, order.status);
    }

    order.status = OrderStatus.PAID;
    await manager.save(order);

    return { order, transitioned: true };
  }

  async createVerificationOrder(
    verificationId: string,
    userId: string,
    packageId: string,
    manager?: EntityManager,
  ): Promise<Order> {
    const propertyVerificationRepository = manager
      ? manager.getRepository(PropertyVerification)
      : this.propertyVerificationRepository;
    const userRepository = manager
      ? manager.getRepository(User)
      : this.userRepository;
    const packageRepository = manager
      ? manager.getRepository(VerificationPackage)
      : this.packageRepository;
    const orderRepository = manager
      ? manager.getRepository(Order)
      : this.orderRepository;

    if (manager) {
      await propertyVerificationRepository.findOne({
        where: { id: verificationId },
        lock: { mode: 'pessimistic_write' },
      });
    }
    const verification = await propertyVerificationRepository.findOne({
      where: { id: verificationId },
      relations: ['user'],
    });

    if (!verification || verification.user.id !== userId) {
      throw new NotFoundException('Verification request not found');
    }

    if (
      ![
        VerificationStageStatus.VERIFICATION_ACCEPTED,
        VerificationStageStatus.PENDING_PAYMENT,
      ].includes(verification.stage)
    ) {
      throw new NotFoundException(
        'Verification request is not in the correct stage to be paid for',
      );
    }

    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const verificationPackage = await packageRepository.findOne({
      where: { id: packageId, isActive: true },
    });
    if (!verificationPackage) {
      throw new NotFoundException('Verification package not found or inactive');
    }

    const existingOrder = await orderRepository.findOne({
      where: {
        propertyVerification: { id: verificationId },
        status: OrderStatus.PENDING,
      },
      relations: [
        'verificationPackage',
        'propertyVerification',
        'propertyVerification.user',
        'user',
      ],
    });

    if (existingOrder) {
      if (existingOrder.verificationPackage?.id !== packageId) {
        throw new BadRequestException(
          'A pending order exists for a different verification package',
        );
      }
      return existingOrder;
    }

    const order = orderRepository.create({
      amount: verificationPackage.price,
      currency: 'NGN',
      status: OrderStatus.PENDING,
      user,
      propertyVerification: verification,
      verificationPackage,
    });

    const savedOrder = await orderRepository.save(order);

    // Update verification with selected package and stage
    verification.verificationPackage = verificationPackage;
    if (verification.stage !== VerificationStageStatus.PENDING_PAYMENT) {
      verification.stage = VerificationStageStatus.PENDING_PAYMENT;
      if (!verification.stageHistory) verification.stageHistory = [];
      verification.stageHistory.push({
        stage: VerificationStageStatus.PENDING_PAYMENT,
        completedAt: new Date(),
      });
    }
    await propertyVerificationRepository.save(verification);

    return savedOrder;
  }

  async findPendingVerificationOrder(
    manager: EntityManager,
    verificationId: string,
  ): Promise<Order | null> {
    return manager.findOne(Order, {
      where: {
        propertyVerification: { id: verificationId },
        status: OrderStatus.PENDING,
      },
      relations: [
        'verificationPackage',
        'propertyVerification',
        'propertyVerification.user',
        'user',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async cancelPendingOrder(
    manager: EntityManager,
    orderId: string,
  ): Promise<void> {
    await manager.update(
      Order,
      { id: orderId, status: OrderStatus.PENDING },
      { status: OrderStatus.CANCELLED },
    );
  }

  async hasPaidOrderForVerification(
    manager: EntityManager,
    verificationId: string,
  ): Promise<boolean> {
    return manager.exists(Order, {
      where: {
        propertyVerification: { id: verificationId },
        status: OrderStatus.PAID,
      },
    });
  }

  async getMyOrders(
    userId: string,
    queryDto: PaginationQueryDto,
  ): Promise<PaginationAndSortingResult<Order>> {
    const findOptions = PaginationAndSorting.createFindOptions<Order>(
      null,
      queryDto,
      { user: { id: userId } },
      {},
      ['propertyVerification'],
    );

    const [items, total] = await this.orderRepository.findAndCount(findOptions);

    return PaginationAndSorting.getPaginateResult(
      items,
      total,
      queryDto,
      (item: Order) => item,
    );
  }

  async getOrderForVerification(
    verificationId: string,
    userId: string,
  ): Promise<any> {
    const order = await this.orderRepository.findOne({
      where: {
        propertyVerification: { id: verificationId },
        user: { id: userId },
      },
      relations: ['transactions', 'propertyVerification'],
      order: { createdAt: 'DESC' },
    });

    if (!order) {
      throw new NotFoundException('Order not found for this verification');
    }

    // Return order with transactions and trimmed property verification data
    const { propertyVerification, ...orderData } = order;
    return {
      ...orderData,
      propertyVerification: propertyVerification
        ? {
            id: propertyVerification.id,
            stage: propertyVerification.stage,
            caseId: propertyVerification.caseId,
            createdAt: propertyVerification.createdAt,
          }
        : null,
    };
  }

  async getAdminOrders(
    queryDto: PaginationQueryDto,
    status?: OrderStatus,
    userId?: string,
  ): Promise<PaginationAndSortingResult<Order>> {
    const where: FindOptionsWhere<Order> = {};
    if (status) where.status = status;
    if (userId) where.user = { id: userId };

    const findOptions = PaginationAndSorting.createFindOptions<Order>(
      null,
      queryDto,
      where,
      {},
      ['user', 'propertyVerification'],
    );

    const [items, total] = await this.orderRepository.findAndCount(findOptions);

    return PaginationAndSorting.getPaginateResult(
      items,
      total,
      queryDto,
      (item: Order) => item,
    );
  }
}
