import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../model/entity/order.entity';
import { PropertyVerification } from '../../model/entity/property-verification.entity';
import { User } from '../../model/entity/user.entity';
import { VerificationPackage } from '../../model/entity/verification-package.entity';
import { OrderStatus } from '../../model/enum/order-status.enum';
import { PaginationAndSorting, PaginationQueryDto, PaginationAndSortingResult } from '../../utility/pagination-and-sorting';
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
    ) { }

    async createVerificationOrder(verificationId: string, userId: string, packageId: string): Promise<Order> {
        const verification = await this.propertyVerificationRepository.findOne({
            where: { id: verificationId },
            relations: ['user']
        });

        if (!verification || verification.user.id !== userId) {
            throw new NotFoundException('Verification request not found');
        }

        // Must be in VERIFICATION_ACCEPTED stage to create an order
        if (verification.stage !== VerificationStageStatus.VERIFICATION_ACCEPTED) {
            throw new NotFoundException('Verification request is not in the correct stage to be paid for');
        }

        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const verificationPackage = await this.packageRepository.findOne({
            where: { id: packageId, isActive: true },
        });
        if (!verificationPackage) {
            throw new NotFoundException('Verification package not found or inactive');
        }

        // We can check if a pending order already exists to avoid duplicates
        const existingOrder = await this.orderRepository.findOne({
            where: {
                propertyVerification: { id: verificationId },
                status: OrderStatus.PENDING
            }
        });

        if (existingOrder) {
            return existingOrder;
        }

        const order = this.orderRepository.create({
            amount: verificationPackage.price,
            currency: 'NGN',
            status: OrderStatus.PENDING,
            user,
            propertyVerification: verification,
            verificationPackage,
        });

        const savedOrder = await this.orderRepository.save(order);

        // Update verification with selected package and stage
        verification.verificationPackage = verificationPackage;
        verification.stage = VerificationStageStatus.PENDING_PAYMENT;
        if (!verification.stageHistory) verification.stageHistory = [];
        verification.stageHistory.push({ stage: VerificationStageStatus.PENDING_PAYMENT, completedAt: new Date() });
        await this.propertyVerificationRepository.save(verification);

        return savedOrder;
    }

    async getMyOrders(userId: string, queryDto: PaginationQueryDto): Promise<PaginationAndSortingResult<Order>> {
        const findOptions = PaginationAndSorting.createFindOptions<Order>(
            null,
            queryDto,
            { user: { id: userId } } as any,
            {},
            ['propertyVerification']
        );

        const [items, total] = await this.orderRepository.findAndCount(findOptions);

        return PaginationAndSorting.getPaginateResult(
            items,
            total,
            queryDto,
            (item: Order) => item
        );
    }

    async getOrderForVerification(verificationId: string, userId: string): Promise<any> {
        const order = await this.orderRepository.findOne({
            where: {
                propertyVerification: { id: verificationId },
                user: { id: userId },
            },
            relations: ['transactions', 'propertyVerification'],
        });

        if (!order) {
            throw new NotFoundException('Order not found for this verification');
        }

        // Return order with transactions and trimmed property verification data
        const { propertyVerification, ...orderData } = order;
        return {
            ...orderData,
            propertyVerification: propertyVerification ? {
                id: propertyVerification.id,
                stage: propertyVerification.stage,
                caseId: propertyVerification.caseId,
                createdAt: (propertyVerification as any).createdAt,
            } : null,
        };
    }

    async getAdminOrders(queryDto: PaginationQueryDto, status?: OrderStatus, userId?: string): Promise<PaginationAndSortingResult<Order>> {
        const where: any = {};
        if (status) where.status = status;
        if (userId) where.user = { id: userId };

        const findOptions = PaginationAndSorting.createFindOptions<Order>(
            null,
            queryDto,
            where,
            {},
            ['user', 'propertyVerification']
        );

        const [items, total] = await this.orderRepository.findAndCount(findOptions);

        return PaginationAndSorting.getPaginateResult(
            items,
            total,
            queryDto,
            (item: Order) => item
        );
    }
}
