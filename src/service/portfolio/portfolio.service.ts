import {
    BadRequestException,
    Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PortfolioItem } from '../../model/entity/portfolio-item.entity';
import { Repository } from 'typeorm';
import { PropertyService } from '../property/property.service';
import { UserService } from '../user/user.service';
import { MyLoggerService } from '../logger/my-logger.service';
import { PropertyDto } from '../../model/dto/property.dto';
import {
    PaginationAndSorting,
    PaginationAndSortingResult,
    PaginationQueryDto,
} from '../../utility/pagination-and-sorting';

@Injectable()
export class PortfolioService {
    private readonly logger: MyLoggerService = new MyLoggerService(
        PortfolioService.name,
    );

    constructor(
        @InjectRepository(PortfolioItem)
        private readonly portfolioRepository: Repository<PortfolioItem>,
        private readonly propertyService: PropertyService,
        private readonly userService: UserService,
    ) { }

    async lookupProperty(pin: string, userId: string): Promise<PropertyDto> {
        const property = await this.propertyService.findById(pin, [
            'company',
            'location',
            'certificationOfOccupancy',
            'contractOfSale',
            'surveyPlan',
            'deedOfConveyance',
            'letterOfIntent',
            'company.user',
            'users',
        ]);

        const isOwner = property.company.user.id === userId;
        const isAssigned = property.users?.some((u) => u.id === userId);
        const userRole = (await this.userService.findById(userId)).role;

        const includeDocuments = isOwner || isAssigned || userRole !== 'USER';

        return {
            id: property.id,
            name: property.name,
            pin: property.pin,
            isSubProperty: property.isSubProperty,
            description: property.description,
            area: property.area,
            propertyVerificationStatus: property.propertyVerificationStatus,
            polygon: property.location?.locationPolygon,
            address: property.location?.address,
            city: property.location?.city,
            state: property.location?.state,
            propertyType: property.propertyType,
            certificationOfOccupancy:
                includeDocuments && property.certificationOfOccupancy
                    ? property.certificationOfOccupancy.url
                    : null,
            contractOfSale:
                includeDocuments && property.contractOfSale
                    ? property.contractOfSale.url
                    : null,
            surveyPlan:
                includeDocuments && property.surveyPlan ? property.surveyPlan.url : null,
            letterOfIntent:
                includeDocuments && property.letterOfIntent
                    ? property.letterOfIntent.url
                    : null,
            deedOfConveyance:
                includeDocuments && property.deedOfConveyance
                    ? property.deedOfConveyance.url
                    : null,
            users: property.isSubProperty
                ? property.users.map((user) => {
                    return {
                        userId: user.id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        profileImageUrl: user.profileImage ? user.profileImage.url : null,
                    };
                })
                : null,
        };
    }

    async claimProperty(pin: string, userId: string): Promise<string> {
        const user = await this.userService.findById(userId);
        const property = await this.propertyService.findById(pin, ['users']);

        if (!property.users?.some((u) => u.id === user.id)) {
            throw new BadRequestException(
                'You do not have permission to claim this property',
            );
        }

        const existingClaim = await this.portfolioRepository.findOne({
            where: { user: { id: user.id }, property: { id: property.id } },
        });

        if (existingClaim) {
            throw new BadRequestException('Property already claimed');
        }

        const claim = this.portfolioRepository.create({
            user,
            property,
        });

        await this.portfolioRepository.save(claim);
        this.logger.log(`User ${userId} claimed property ${property.id}`);

        return 'Property claimed successfully';
    }

    async getMyProperties(
        userId: string,
        queryDto: PaginationQueryDto,
    ): Promise<PaginationAndSortingResult<any>> {
        const findOptions = PaginationAndSorting.createFindOptions<PortfolioItem>(
            null,
            queryDto,
            { user: { id: userId } } as any,
            {},
            [
                'property',
                'property.location',
                'property.contractOfSale',
                'property.surveyPlan',
                'property.deedOfConveyance',
            ],
        );

        const [items, total] = await this.portfolioRepository.findAndCount(findOptions);

        return PaginationAndSorting.getPaginateResult(
            items,
            total,
            queryDto,
            (item: PortfolioItem) => {
                const property = item.property;
                return {
                    id: property.id,
                    name: property.name,
                    pin: property.pin,
                    description: property.description,
                    area: property.area,
                    propertyVerificationStatus: property.propertyVerificationStatus,
                    polygon: property.location?.locationPolygon,
                    address: property.location?.address,
                    city: property.location?.city,
                    state: property.location?.state,
                    propertyType: property.propertyType,
                    contractOfSale: property.contractOfSale ? property.contractOfSale.url : null,
                    surveyPlan: property.surveyPlan ? property.surveyPlan.url : null,
                    deedOfConveyance: property.deedOfConveyance ? property.deedOfConveyance.url : null,
                    claimedAt: item.createdAt,
                };
            },
        );
    }
}
