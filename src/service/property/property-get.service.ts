import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from '../../model/entity/property.entity';
import { LocationEntity } from '../../model/entity/location.entity';
import { CompanyService } from '../company/company.service';
import { UserService } from '../user/user.service';
import { User } from '../../model/entity/user.entity';
import { UserRole } from '../../model/enum/role.enum';
import {
  PaginationAndSorting,
  PaginationAndSortingResult,
  PaginationQueryDto,
} from '../../utility/pagination-and-sorting';
import {
  LocationQueryDto,
  NearbyQueryDto,
  ViewportQueryDto,
} from 'src/model/request/property-view-query.dto';
import { PropertyLookupResponseDto } from '../../model/response/property-lookup-response.dto';
import { PropertySearchQueryDto } from '../../model/request/property-search.dto';
import {
  AdminPropertyDetailsDto,
  PropertyDto,
  PropertyVersionDto,
} from '../../model/dto/property.dto';
import { Company } from '../../model/entity/company.entity';
import { MyLoggerService } from '../logger/my-logger.service';
import { PropertyHelperService } from './property-helper.service';
import { PropertyVersionService } from './version/property-version.service';
import { PropertyVersion } from '../../model/entity/property-version.entity';

@Injectable()
export class PropertyGetService {
  private readonly logger: MyLoggerService = new MyLoggerService(
    PropertyGetService.name,
  );

  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    @InjectRepository(LocationEntity)
    private readonly locationRepository: Repository<LocationEntity>,
    private readonly companyService: CompanyService,
    private readonly userService: UserService,
    private readonly propertyHelper: PropertyHelperService,
    private readonly propertyVersionService: PropertyVersionService,
  ) {}

  async getAllProperties(
    searchQuery: PropertySearchQueryDto,
  ): Promise<PaginationAndSortingResult<PropertyLookupResponseDto>> {
    const findOptions = PaginationAndSorting.createFindOptions<Property>(
      'name',
      searchQuery,
      {},
      {
        propertyVerificationStatus: searchQuery.verificationStatus,
        propertyType: searchQuery.propertyType,
        isSubProperty: searchQuery.isSubProperty,
        isPublic: searchQuery.isPublic,
      },
      ['company', 'users', 'location'],
    );

    const [properties, count] =
      await this.propertyRepository.findAndCount(findOptions);

    return PaginationAndSorting.getPaginateResult(
      properties,
      count,
      searchQuery,
      (property) => this.propertyHelper.convertToLookupResponse(property, true),
    );
  }

  async getOne(propertyId: string, userId: string): Promise<PropertyDto> {
    const user: User = await this.userService.findById(userId);

    const property: Property = await this.findById(propertyId, [
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
      'users.profileImage',
    ]);

    const isOwner = property.company.user.id === userId;
    const isNonUserRole = user.role !== UserRole.USER;
    const includeDocuments = isOwner || isNonUserRole;

    this.logger.log(
      `Retrieved property ${property.id} for user ${userId}`,
      PropertyGetService.name,
    );
    const response = this.propertyHelper.convertToDto(
      property,
      includeDocuments,
    );
    if (
      property.isSubProperty &&
      [UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role)
    ) {
      const activeVersion = await this.propertyVersionService.findActiveVersion(
        property.id,
      );
      response.proposedUsers = activeVersion
        ? (activeVersion.users || []).map((proposedUser) => ({
            userId: proposedUser.id,
            firstName: proposedUser.firstName,
            lastName: proposedUser.lastName,
            email: proposedUser.email,
            profileImageUrl: proposedUser.profileImage?.url ?? null,
          }))
        : null;
    }
    return response;
  }

  async getOneForAdmin(identifier: string): Promise<AdminPropertyDetailsDto> {
    const property: Property = await this.findById(identifier, [
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
      'users.profileImage',
    ]);

    const activeVersion = await this.propertyVersionService.findActiveVersion(
      property.id,
    );

    this.logger.log(
      `Retrieved admin property details ${property.id}`,
      PropertyGetService.name,
    );

    return {
      current: this.propertyHelper.convertToDto(property, true),
      pendingVersion: activeVersion
        ? this.convertVersionToDto(activeVersion)
        : null,
    };
  }

  async getAllCompanyProperties(
    userId: string,
    companyId: string,
    propertyQuery: PaginationQueryDto,
  ): Promise<PaginationAndSortingResult<PropertyDto>> {
    const user: User = await this.userService.findById(userId);
    const company: Company = await this.companyService.findById(companyId, [
      'user',
    ]);

    if (
      company.user.id !== userId ||
      (company.user.id !== userId && user.role === UserRole.USER)
    ) {
      throw new UnauthorizedException(
        'Not authorized to view company properties',
      );
    }

    const isOwner = company.user.id === userId;
    const isNonUserRole = user.role !== UserRole.USER;
    const includeDocuments = isOwner || isNonUserRole;

    const findOptions = PaginationAndSorting.createFindOptions<Property>(
      null,
      propertyQuery,
      {},
      { company: { id: company.id }, isSubProperty: false },
      [
        'company',
        'location',
        'certificationOfOccupancy',
        'contractOfSale',
        'surveyPlan',
        'deedOfConveyance',
        'letterOfIntent',
        'otherDocuments',
      ],
    );

    const [properties, count] =
      await this.propertyRepository.findAndCount(findOptions);

    this.logger.log(
      `Retrieved company properties for company ${company.id} for user ${userId}`,
      PropertyGetService.name,
    );
    return PaginationAndSorting.getPaginateResult(
      properties,
      count,
      propertyQuery,
      (property) =>
        this.propertyHelper.convertToDto(property, includeDocuments),
    );
  }

  async getAllPropertySubProperty(
    propertyId: string,
    userId: string,
    propertyQuery: PaginationQueryDto,
  ): Promise<PaginationAndSortingResult<PropertyDto>> {
    const user: User = await this.userService.findById(userId);
    const property: Property = await this.findById(propertyId, [
      'company',
      'company.user',
    ]);

    const isOwner = property.company.user.id === userId;
    const isNonUserRole = user.role !== UserRole.USER;
    const includeDocuments = isOwner || isNonUserRole;

    const findOptions = PaginationAndSorting.createFindOptions<Property>(
      null,
      propertyQuery,
      { parentProperty: { id: property.id } },
      {},
      [
        'company',
        'location',
        'certificationOfOccupancy',
        'contractOfSale',
        'surveyPlan',
        'deedOfConveyance',
        'letterOfIntent',
        'otherDocuments',
        'users',
        'users.profileImage',
      ],
    );

    const [properties, count] =
      await this.propertyRepository.findAndCount(findOptions);

    this.logger.log(
      `Retrieved sub-properties property ${property.id} for user ${userId}`,
      PropertyGetService.name,
    );
    return PaginationAndSorting.getPaginateResult(
      properties,
      count,
      propertyQuery,
      (subProperty) =>
        this.propertyHelper.convertToDto(subProperty, includeDocuments),
    );
  }

  async findById(
    propertyId: string,
    relations: string[] = [],
  ): Promise<Property> {
    const isPin = propertyId.startsWith('VP-');
    const property: Property | null = await this.propertyRepository.findOne({
      where: isPin ? { pin: propertyId } : { id: propertyId },
      relations,
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return property;
  }

  private convertVersionToDto(version: PropertyVersion): PropertyVersionDto {
    return {
      id: version.id,
      createdAt: version.createdAt,
      updatedAt: version.updatedAt,
      deletedAt: version.deletedAt,
      status: version.status,
      propertyType: version.propertyType,
      area: version.area,
      polygon: version.locationPolygon,
      address: version.address,
      city: version.city,
      state: version.state,
      certificationOfOccupancy: version.certificationOfOccupancy?.url ?? null,
      contractOfSale: version.contractOfSale?.url ?? null,
      surveyPlan: version.surveyPlan?.url ?? null,
      letterOfIntent: version.letterOfIntent?.url ?? null,
      deedOfConveyance: version.deedOfConveyance?.url ?? null,
      otherDocuments: version.otherDocuments?.length
        ? version.otherDocuments.map((document) => ({
            label: document.label,
            url: document.file.url,
          }))
        : null,
      users: version.users?.length
        ? version.users.map((user) => ({
            userId: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            profileImageUrl: user.profileImage?.url ?? null,
          }))
        : null,
      adminComments: version.adminComments,
      statusHistory: version.statusHistory || [],
    };
  }

  async getPropertiesInViewport(
    userId: string,
    propertyQuery: ViewportQueryDto,
  ): Promise<PaginationAndSortingResult<PropertyLookupResponseDto>> {
    const {
      north,
      south,
      east,
      west,
      zoom,
      page,
      limit,
      propertyType,
      status,
      companyId,
    } = propertyQuery;

    const user: User = await this.userService.findById(userId);
    const isUser = user.role === UserRole.USER;
    const isCompanyScoped = !!companyId;

    if (companyId) {
      await this.validateCompanyMapAccess(companyId, user, userId);
    }

    const boundingBox = {
      type: 'Polygon',
      coordinates: [
        [
          [west, south],
          [east, south],
          [east, north],
          [west, north],
          [west, south],
        ],
      ],
    };

    let queryBuilder = this.locationRepository
      .createQueryBuilder('location')
      .leftJoinAndSelect('location.property', 'property')
      .leftJoinAndSelect('property.company', 'company')
      .leftJoinAndSelect('property.users', 'users')
      .where(
        'ST_Intersects(location.locationPolygon, ST_GeomFromGeoJSON(:bbox))',
        {
          bbox: JSON.stringify(boundingBox),
        },
      );

    if (companyId) {
      queryBuilder = queryBuilder.andWhere('company.id = :companyId', {
        companyId,
      });
    }

    if (isUser && !isCompanyScoped) {
      queryBuilder = queryBuilder.andWhere('property.isPublic = :public', {
        public: true,
      });
    } else {
      if (status) {
        queryBuilder = queryBuilder.andWhere(
          'property.propertyVerificationStatus = :status',
          { status },
        );
      }
    }

    if (propertyType) {
      queryBuilder = queryBuilder.andWhere(
        'property.propertyType = :propertyType',
        { propertyType },
      );
    }

    if (zoom && zoom < 12) {
      queryBuilder = queryBuilder.andWhere('property.area > :minArea', {
        minArea: 10000,
      });
    }

    const centerLng = (east + west) / 2;
    const centerLat = (north + south) / 2;
    queryBuilder = queryBuilder
      .addSelect(
        `ST_Distance("location"."locationPolygon"::geography, ST_SetSRID(ST_Point(${centerLng}, ${centerLat}), 4326)::geography)`,
        'distance',
      )
      .orderBy('distance', 'ASC')
      .skip((page! - 1) * limit!)
      .take(limit);

    const [results, count] = await queryBuilder.getManyAndCount();

    return PaginationAndSorting.getPaginateResult(
      results,
      count,
      { page, limit },
      (location) => {
        const property: Property = location.property;
        property.location = location;
        return this.propertyHelper.convertToLookupResponse(
          property,
          !isUser || isCompanyScoped,
        );
      },
      true,
    );
  }

  async getPropertiesByLocation(
    userId: string,
    locationName: string,
    query: LocationQueryDto,
  ): Promise<PaginationAndSortingResult<PropertyLookupResponseDto>> {
    const { limit, propertyType, page, status, companyId } = query;

    const user: User = await this.userService.findById(userId);
    const isUser = user.role === UserRole.USER;
    const isCompanyScoped = !!companyId;

    if (companyId) {
      await this.validateCompanyMapAccess(companyId, user, userId);
    }

    let queryBuilder = this.locationRepository
      .createQueryBuilder('location')
      .leftJoinAndSelect('location.property', 'property')
      .leftJoinAndSelect('property.company', 'company')
      .leftJoinAndSelect('property.users', 'users')
      .where(
        `(
          LOWER(location.city)    LIKE LOWER(:locationName)
          OR LOWER(location.state)   LIKE LOWER(:locationName)
          OR LOWER(location.address) LIKE LOWER(:locationName)
      )`,
        { locationName: `%${locationName}%` },
      )
      .andWhere('location.locationPolygon IS NOT NULL');

    if (companyId) {
      queryBuilder = queryBuilder.andWhere('company.id = :companyId', {
        companyId,
      });
    }

    if (propertyType) {
      queryBuilder = queryBuilder.andWhere(
        'property.propertyType = :propertyType',
        { propertyType },
      );
    }

    if (isUser && !isCompanyScoped) {
      queryBuilder = queryBuilder.andWhere('property.isPublic = :public', {
        public: true,
      });
    } else {
      if (status) {
        queryBuilder = queryBuilder.andWhere(
          'property.propertyVerificationStatus = :status',
          { status },
        );
      }
    }

    queryBuilder = queryBuilder
      .orderBy('property.area', 'DESC')
      .skip((page! - 1) * limit!)
      .take(limit);

    const [results, count] = await queryBuilder.getManyAndCount();

    return PaginationAndSorting.getPaginateResult(
      results,
      count,
      { page, limit },
      (location) => {
        const property: Property = location.property;
        property.location = location;
        return this.propertyHelper.convertToLookupResponse(
          property,
          !isUser || isCompanyScoped,
        );
      },
      true,
    );
  }

  async getNearbyProperties(
    userId: string,
    query: NearbyQueryDto,
  ): Promise<PaginationAndSortingResult<PropertyLookupResponseDto>> {
    const { latitude, longitude, radiusKm, limit, page, status, companyId } =
      query;

    const user: User = await this.userService.findById(userId);
    const isUser = user.role === UserRole.USER;
    const isCompanyScoped = !!companyId;

    if (companyId) {
      await this.validateCompanyMapAccess(companyId, user, userId);
    }

    let queryBuilder = this.locationRepository
      .createQueryBuilder('location')
      .leftJoinAndSelect('location.property', 'property')
      .leftJoinAndSelect('property.company', 'company')
      .leftJoinAndSelect('property.users', 'users')
      .where(
        'ST_DWithin(location.locationPolygon, ST_Point(:lng, :lat)::geography, :radius)',
        {
          lng: longitude,
          lat: latitude,
          radius: radiusKm * 1000,
        },
      )
      .addSelect(
        'ST_Distance("location"."locationPolygon"::geography, ST_SetSRID(ST_Point(:lng, :lat), 4326)::geography)',
        'distance',
      )
      .orderBy('distance', 'ASC')
      .skip((page! - 1) * limit!)
      .take(limit);

    if (companyId) {
      queryBuilder = queryBuilder.andWhere('company.id = :companyId', {
        companyId,
      });
    }

    if (isUser && !isCompanyScoped) {
      queryBuilder = queryBuilder.andWhere('property.isPublic = :public', {
        public: true,
      });
    } else {
      if (status) {
        queryBuilder = queryBuilder.andWhere(
          'property.propertyVerificationStatus = :status',
          { status },
        );
      }
    }

    const [results, count] = await queryBuilder.getManyAndCount();

    return PaginationAndSorting.getPaginateResult(
      results,
      count,
      { page, limit },
      (location) => {
        const property: Property = location.property;
        property.location = location;
        return this.propertyHelper.convertToLookupResponse(
          property,
          !isUser || isCompanyScoped,
        );
      },
      true,
    );
  }

  private async validateCompanyMapAccess(
    companyId: string,
    user: User,
    userId: string,
  ): Promise<void> {
    const company: Company = await this.companyService.findById(companyId, [
      'user',
    ]);

    const isOwner = company.user.id === userId;
    const isAdmin =
      user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;

    if (!isOwner && !isAdmin) {
      throw new UnauthorizedException(
        'Not authorized to view company property map',
      );
    }
  }
}
