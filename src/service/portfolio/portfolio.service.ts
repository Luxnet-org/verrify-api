import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PortfolioItem } from '../../model/entity/portfolio-item.entity';
import { FindOptionsWhere, Repository } from 'typeorm';
import { UserService } from '../user/user.service';
import { MyLoggerService } from '../logger/my-logger.service';
import { PropertyDto } from '../../model/dto/property.dto';
import {
  PaginationAndSorting,
  PaginationAndSortingResult,
  PaginationQueryDto,
} from '../../utility/pagination-and-sorting';
import { UserRole } from '../../model/enum/role.enum';
import { PropertyGetService } from '../property/property-get.service';
import { PropertyHelperService } from '../property/property-helper.service';
import { FileService } from '../file/file.service';

@Injectable()
export class PortfolioService {
  private readonly logger: MyLoggerService = new MyLoggerService(
    PortfolioService.name,
  );

  constructor(
    @InjectRepository(PortfolioItem)
    private readonly portfolioRepository: Repository<PortfolioItem>,
    private readonly propertyGetService: PropertyGetService,
    private readonly propertyHelper: PropertyHelperService,
    private readonly userService: UserService,
    private readonly fileService: FileService,
  ) {}

  async lookupProperty(pin: string, userId: string): Promise<PropertyDto> {
    const property = await this.propertyGetService.findById(pin, [
      'company',
      'location',
      'certificationOfOccupancy',
      'contractOfSale',
      'surveyPlan',
      'deedOfConveyance',
      'letterOfIntent',
      'otherDocuments',
      'company.user',
      'users',
    ]);

    const isOwner = property.company.user.id === userId;
    const isAssigned = property.users?.some((u) => u.id === userId);
    const userRole = (await this.userService.findById(userId)).role;

    const includeDocuments =
      isOwner || isAssigned || userRole !== UserRole.USER;

    return this.propertyHelper.convertToDto(property, includeDocuments);
  }

  async claimProperty(pin: string, userId: string): Promise<string> {
    const user = await this.userService.findById(userId);
    const property = await this.propertyGetService.findById(pin, ['users']);

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
      { user: { id: userId } } as FindOptionsWhere<PortfolioItem>,
      {},
      [
        'property',
        'property.location',
        'property.contractOfSale',
        'property.surveyPlan',
        'property.deedOfConveyance',
      ],
    );

    const [items, total] =
      await this.portfolioRepository.findAndCount(findOptions);

    return PaginationAndSorting.getPaginateResultAsync(
      items,
      total,
      queryDto,
      async (item: PortfolioItem) => {
        const property = item.property;
        const [contractOfSale, surveyPlan, deedOfConveyance] =
          await Promise.all([
            this.fileService.resolveUrl(property.contractOfSale),
            this.fileService.resolveUrl(property.surveyPlan),
            this.fileService.resolveUrl(property.deedOfConveyance),
          ]);
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
          contractOfSale,
          surveyPlan,
          deedOfConveyance,
          claimedAt: item.createdAt,
        };
      },
    );
  }
}
