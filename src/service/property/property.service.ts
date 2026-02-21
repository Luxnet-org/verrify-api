import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { MyLoggerService } from '../logger/my-logger.service';
import { Property } from '../../model/entity/property.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataSource } from 'typeorm';
import { CompanyService } from '../company/company.service';
import { CreatePropertyRequestDto } from '../../model/request/create-property-request.dto';
import { PropertyDto } from '../../model/dto/property.dto';
import { Company } from '../../model/entity/company.entity';
import { PropertyVerificationStatus } from '../../model/enum/property-verification-status.enum';
import * as turf from '@turf/turf';
import { LocationEntity } from '../../model/entity/location.entity';
import { FileService } from '../file/file.service';
import { FileType } from '../../model/enum/file-type.enum';
import { UpdatePropertyRequestDto } from '../../model/request/update-property-request.dto';
import { UserService } from '../user/user.service';
import { User } from '../../model/entity/user.entity';
import { UserRole } from '../../model/enum/role.enum';
import { VerdictDto } from '../../model/request/verdict.dto';
import { CreateSubPropertyRequestDto } from '../../model/request/create-subproperty-request.dto';
import {
  PaginationAndSorting,
  PaginationAndSortingResult,
  PaginationQueryDto,
} from '../../utility/pagination-and-sorting';
import { Polygon } from 'geojson';
import {
  LocationQueryDto,
  NearbyQueryDto,
  ViewportQueryDto,
} from 'src/model/request/property-view-query.dto';
import { PropertyLookupResponseDto } from '../../model/response/property-lookup-response.dto';
import { CompanyVerificationStatus } from '../../model/enum/company-verification-status.enum';
import { PropertySearchQueryDto } from '../../model/request/property-search.dto';
import { EmailEvent } from '../email/email-event.service';
import { EmailRequest } from '../../model/request/email-request.dto';
import { EmailType } from '../../model/enum/email-type.enum';

@Injectable()
export class PropertyService {
  private readonly logger: MyLoggerService = new MyLoggerService(
    PropertyService.name,
  );

  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    private readonly companyService: CompanyService,
    @InjectRepository(LocationEntity)
    private readonly locationRepository: Repository<LocationEntity>,
    private readonly fileService: FileService,
    private readonly userService: UserService,
    private readonly emailEvent: EmailEvent,
    private readonly dataSource: DataSource,
  ) { }

  async create(
    userId: string,
    propertyRequest: CreatePropertyRequestDto,
  ): Promise<PropertyDto> {
    const company: Company = await this.companyService.findByUserId(userId);
    if (
      company.companyVerificationStatus !== CompanyVerificationStatus.VERIFIED
    )
      throw new BadRequestException(
        'Company verification status is not verified',
      );

    await this.validatePolygon(propertyRequest.polygon);

    const calcArea = turf.area(propertyRequest.polygon);

    return this.dataSource.transaction(async (manager) => {
      let property: Property = manager.create(Property, {
        name: propertyRequest.name,
        description: propertyRequest.description,
        propertyType: propertyRequest.propertyType,
        propertyVerificationStatus: PropertyVerificationStatus.NOT_VERIFIED,
        area: calcArea,
        company,
      });

      property = await manager.save(property);

      const location: LocationEntity = manager.create(LocationEntity, {
        locationPolygon: propertyRequest.polygon,
        property,
      });
      if (propertyRequest.address) {
        if (!propertyRequest.city || !propertyRequest.state) {
          throw new BadRequestException(
            'Provide a city and state when address is provided',
          );
        }

        location.address = propertyRequest.address;
        location.city = propertyRequest.city;
        location.state = propertyRequest.state;
      }
      await manager.save(location);
      property.location = location;

      if (propertyRequest.certificationOfOccupancy) {
        property.certificationOfOccupancy = await this.fileService.updateWithUrl(
          propertyRequest.certificationOfOccupancy,
          property,
          FileType.CERTIFICATE_OF_OCCUPANCY,
        );
      }

      if (propertyRequest.contractOfSale) {
        property.contractOfSale = await this.fileService.updateWithUrl(
          propertyRequest.contractOfSale,
          property,
          FileType.CONTRACT_OF_SALE,
        );
      }

      if (propertyRequest.surveyPlan) {
        property.surveyPlan = await this.fileService.updateWithUrl(
          propertyRequest.surveyPlan,
          property,
          FileType.SURVEY_PLAN,
        );
      }

      if (propertyRequest.letterOfIntent) {
        property.letterOfIntent = await this.fileService.updateWithUrl(
          propertyRequest.letterOfIntent,
          property,
          FileType.LETTER_OF_INTENT,
        );
      }

      this.logger.log(
        `Company: ${company.id} made a create property request: ${property.id}`,
        PropertyService.name,
      );

      return this.convertToDto(property);
    });
  }

  async createSubProperty(
    propertyId: string,
    userId: string,
    propertyRequest: CreateSubPropertyRequestDto,
  ): Promise<PropertyDto> {
    const user: User = await this.userService.findById(userId, ['company']);
    const property: Property = await this.findById(propertyId, [
      'company',
      'location',
      'company.user',
    ]);

    if (
      property.company.companyVerificationStatus !==
      CompanyVerificationStatus.VERIFIED
    )
      throw new BadRequestException(
        'Company verification status is not verified',
      );

    if (property.company.user.id !== userId) {
      throw new UnauthorizedException(
        `User cannot create a sub-property for property ${propertyId}`,
      );
    }

    if (
      property.propertyVerificationStatus !==
      PropertyVerificationStatus.VERIFIED
    ) {
      throw new BadRequestException(
        'Property verification status is not verified',
      );
    }

    const parent = turf.polygon(property.location.locationPolygon.coordinates);
    const sub = turf.polygon(propertyRequest.polygon.coordinates);

    const isInside = turf.booleanWithin(sub, parent);
    if (!isInside) {
      throw new BadRequestException(
        'The sub-property polygon is not fully inside the parent property polygon.',
      );
    }

    await this.validatePolygon(propertyRequest.polygon, [property.id]);

    const calcArea = turf.area(propertyRequest.polygon);

    const users: User[] = await Promise.all(
      propertyRequest.users.map(async (user) => {
        return this.userService.findByEmail(user);
      }),
    );

    return this.dataSource.transaction(async (manager) => {
      let newProperty: Property = manager.create(Property, {
        name: propertyRequest.name,
        isSubProperty: true,
        description: propertyRequest.description,
        propertyType: propertyRequest.propertyType,
        propertyVerificationStatus: PropertyVerificationStatus.NOT_VERIFIED,
        area: calcArea,
        company: user.company,
        parentProperty: property,
        users,
      });
      newProperty = await manager.save(newProperty);

      const location: LocationEntity = manager.create(LocationEntity, {
        locationPolygon: propertyRequest.polygon,
        property: newProperty,
      });
      if (propertyRequest.address) {
        location.address = propertyRequest.address;
        location.city = property.location.city;
        location.state = property.location.state;
      }
      await manager.save(location);
      newProperty.location = location;

      if (propertyRequest.deedOfConveyance) {
        newProperty.deedOfConveyance = await this.fileService.updateWithUrl(
          propertyRequest.deedOfConveyance,
          newProperty,
          FileType.DEED_OF_CONVEYANCE,
        );
      }

      if (propertyRequest.contractOfSale) {
        newProperty.contractOfSale = await this.fileService.updateWithUrl(
          propertyRequest.contractOfSale,
          newProperty,
          FileType.CONTRACT_OF_SALE,
        );
      }

      if (propertyRequest.surveyPlan) {
        newProperty.surveyPlan = await this.fileService.updateWithUrl(
          propertyRequest.surveyPlan,
          newProperty,
          FileType.SURVEY_PLAN,
        );
      }

      this.logger.log(
        `Company: ${user.company.id} made a create sub-property request: ${newProperty.id}`,
        PropertyService.name,
      );

      return this.convertToDto(newProperty);
    });
  }

  async update(
    propertyId: string,
    userId: string,
    propertyRequest: UpdatePropertyRequestDto,
  ): Promise<PropertyDto> {
    const user: User = await this.userService.findById(userId, ['company']);
    const company: Company = await this.companyService.findByUserId(userId, [
      'user',
    ]);
    // const company: Company = user.company;

    let property: Property = await this.findById(propertyId, [
      'company',
      'location',
      'certificationOfOccupancy',
      'contractOfSale',
      'surveyPlan',
      'deedOfConveyance',
      'letterOfIntent',
    ]);

    if (
      property.propertyVerificationStatus !==
      PropertyVerificationStatus.NOT_VERIFIED &&
      property.propertyVerificationStatus !==
      PropertyVerificationStatus.REJECTED
    ) {
      throw new BadRequestException('Property cannot be modified');
    }

    if (
      property.company.id !== company.id ||
      (property.company.id !== company.id && user.role === UserRole.USER)
    ) {
      throw new UnauthorizedException(
        'Not authorized to modify property request',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      if (propertyRequest.name) {
        property.name = propertyRequest.name;
      }

      if (propertyRequest.description) {
        property.description = propertyRequest.description;
      }

      if (propertyRequest.propertyType) {
        property.propertyType = propertyRequest.propertyType;
      }

      if (propertyRequest.polygon) {
        await this.validatePolygon(propertyRequest.polygon, [property.id]);

        property.location.locationPolygon = propertyRequest.polygon;
        property.area = turf.area(propertyRequest.polygon);
      }

      if (propertyRequest.address) {
        if (
          !propertyRequest.address ||
          !propertyRequest.city ||
          !propertyRequest.state
        ) {
          throw new BadRequestException(
            'Please provide a city and state when address is modified',
          );
        }
        property.location.address = propertyRequest.address;
        property.location.city = propertyRequest.city;
        property.location.state = propertyRequest.state;
      }

      if (propertyRequest.contractOfSale) {
        if (property.contractOfSale) {
          await this.fileService.updateFile(
            property.contractOfSale,
            null,
            FileType.CONTRACT_OF_SALE,
          );
        }

        property.contractOfSale = await this.fileService.updateWithUrl(
          propertyRequest.contractOfSale,
          property,
          FileType.CONTRACT_OF_SALE,
        );
      }

      if (propertyRequest.surveyPlan) {
        if (property.surveyPlan) {
          await this.fileService.updateFile(
            property.surveyPlan,
            null,
            FileType.SURVEY_PLAN,
          );
        }

        property.surveyPlan = await this.fileService.updateWithUrl(
          propertyRequest.surveyPlan,
          property,
          FileType.SURVEY_PLAN,
        );
      }

      if (!property.isSubProperty) {
        if (propertyRequest.users !== null) {
          property.users = await Promise.all(
            propertyRequest.users.map(async (user) => {
              return this.userService.findByEmail(user);
            }),
          );
        }

        if (propertyRequest.certificationOfOccupancy !== null) {
          if (property.certificationOfOccupancy) {
            await this.fileService.updateFile(
              property.certificationOfOccupancy,
              null,
              FileType.CERTIFICATE_OF_OCCUPANCY,
            );
          }

          property.certificationOfOccupancy =
            await this.fileService.updateWithUrl(
              propertyRequest.certificationOfOccupancy,
              property,
              FileType.CERTIFICATE_OF_OCCUPANCY,
            );
        }

        if (propertyRequest.letterOfIntent) {
          if (property.letterOfIntent) {
            await this.fileService.updateFile(
              property.letterOfIntent,
              null,
              FileType.LETTER_OF_INTENT,
            );
          }

          property.letterOfIntent = await this.fileService.updateWithUrl(
            propertyRequest.letterOfIntent,
            property,
            FileType.LETTER_OF_INTENT,
          );
        }
      }

      if (property.isSubProperty) {
        if (propertyRequest.users && propertyRequest.users.length > 0) {
          property.users = await Promise.all(
            propertyRequest.users.map((userId) => {
              return this.userService.findById(userId);
            }),
          );
        }

        if (propertyRequest.deedOfConveyance) {
          if (property.deedOfConveyance) {
            await this.fileService.updateFile(
              property.deedOfConveyance,
              null,
              FileType.DEED_OF_CONVEYANCE,
            );
          }

          property.deedOfConveyance = await this.fileService.updateWithUrl(
            propertyRequest.deedOfConveyance,
            property,
            FileType.DEED_OF_CONVEYANCE,
          );
        }
      }

      property = await manager.save(property);

      this.logger.log(
        `Company: ${company.id} updated property ${property.id}`,
        PropertyService.name,
      );
      return this.convertToDto(property);
    });
  }

  async submitForVerification(
    propertyId: string,
    userId: string,
  ): Promise<string> {
    const property: Property = await this.findById(propertyId, [
      'company',
      'company.user',
      'location',
      'certificationOfOccupancy',
      'contractOfSale',
      'surveyPlan',
      'deedOfConveyance',
      'users',
      'parentProperty',
      'parentProperty.location',
    ]);

    if (property.company.user.id !== userId) {
      throw new UnauthorizedException(
        'Only the property owner can submit for verification',
      );
    }

    if (
      property.propertyVerificationStatus !==
      PropertyVerificationStatus.NOT_VERIFIED &&
      property.propertyVerificationStatus !==
      PropertyVerificationStatus.REJECTED
    ) {
      throw new BadRequestException(
        `Cannot submit property with status ${property.propertyVerificationStatus}. Only NOT_VERIFIED or REJECTED properties can be submitted.`,
      );
    }

    await this.validatePropertyCompleteness(property);

    property.propertyVerificationStatus = PropertyVerificationStatus.PENDING;
    property.reviewUser = null as any;
    property.reviewedAt = null as any;
    property.verifiedAt = null as any;
    property.verificationMessage = null as any;

    await this.propertyRepository.save(property);

    // Send submission email
    const emailRequest: EmailRequest = {
      type: EmailType.PROPERTY_SUBMITTED,
      to: property.company.user.email,
      context: {
        userName: property.company.user.firstName,
        propertyName: property.name,
        propertyType: property.propertyType,
      },
    };
    await this.emailEvent.sendEmailRequest(emailRequest);

    this.logger.log(
      `Property ${property.id} submitted for verification by user ${userId}`,
    );
    return `Property ${property.id} has been submitted for verification`;
  }

  async assignReview(
    propertyId: string,
    adminUserId: string,
  ): Promise<string> {
    const admin: User = await this.userService.findById(adminUserId);

    if (admin.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('Only admins can assign reviews');
    }

    const property: Property = await this.findById(propertyId, [
      'company',
      'company.user',
    ]);

    if (
      property.propertyVerificationStatus !==
      PropertyVerificationStatus.PENDING
    ) {
      throw new BadRequestException(
        `Cannot assign review for property with status ${property.propertyVerificationStatus}. Only PENDING properties can be assigned for review.`,
      );
    }

    property.propertyVerificationStatus = PropertyVerificationStatus.IN_REVIEW;
    property.reviewUser = admin;
    property.reviewedAt = new Date();

    await this.propertyRepository.save(property);

    this.logger.log(
      `Property ${property.id} assigned for review to admin ${adminUserId}`,
    );
    return `Property ${property.id} is now in review by admin ${admin.firstName}`;
  }

  async giveVerdict(
    propertyId: string,
    adminUserId: string,
    verdictDto: VerdictDto,
  ): Promise<string> {
    const property: Property = await this.findById(propertyId, [
      'company',
      'location',
      'company.user',
      'reviewUser',
      'certificationOfOccupancy',
      'contractOfSale',
      'surveyPlan',
      'deedOfConveyance',
      'users',
      'parentProperty',
      'parentProperty.location',
    ]);

    if (
      property.propertyVerificationStatus !==
      PropertyVerificationStatus.IN_REVIEW
    ) {
      throw new BadRequestException(
        `Cannot give verdict for property with status ${property.propertyVerificationStatus}. Only IN_REVIEW properties can receive a verdict.`,
      );
    }

    if (!property.reviewUser || property.reviewUser.id !== adminUserId) {
      throw new UnauthorizedException(
        'Only the assigned reviewer can give a verdict on this property',
      );
    }

    const newStatus =
      verdictDto.verdict === 'VERIFIED'
        ? PropertyVerificationStatus.VERIFIED
        : PropertyVerificationStatus.REJECTED;

    property.propertyVerificationStatus = newStatus;
    property.verificationMessage = verdictDto.verificationMessage;
    property.verifiedAt = new Date();

    if (newStatus === PropertyVerificationStatus.VERIFIED) {
      await this.validatePropertyCompleteness(property);
      property.isPublic = true;
      if (!property.pin) {
        const statePrefix =
          property.location && property.location.state
            ? property.location.state.substring(0, 2).toUpperCase()
            : 'XX';
        const year = new Date().getFullYear().toString().substring(2);
        const randomDigits = Math.floor(
          1000 + Math.random() * 9000,
        ).toString();
        property.pin = `VP-${statePrefix}-${year}-${randomDigits}`;
      }
    }

    await this.propertyRepository.save(property);

    // Send verdict email
    const emailRequest: EmailRequest = {
      type:
        newStatus === PropertyVerificationStatus.VERIFIED
          ? EmailType.PROPERTY_VERIFIED
          : EmailType.PROPERTY_REJECTED,
      to: property.company.user.email,
      context: {
        userName: property.company.user.firstName,
        propertyName: property.name,
        propertyType: property.propertyType,
        propertyDescription: property.description || '',
        rejectionMessage: verdictDto.verificationMessage,
      },
    };
    await this.emailEvent.sendEmailRequest(emailRequest);

    this.logger.log(
      `Property ${property.id} verdict: ${newStatus} by admin ${adminUserId}`,
    );
    return `Property ${property.id} has been ${newStatus.toLowerCase()}`;
  }

  private async validatePropertyCompleteness(property: Property): Promise<void> {
    if (property.isSubProperty) {
      const missing: string[] = [];
      if (!property.location?.address) missing.push('address');
      if (!property.deedOfConveyance) missing.push('deed of conveyance');
      if (!property.contractOfSale) missing.push('contract of sale');
      if (!property.surveyPlan) missing.push('survey plan');
      if (!property.users || property.users.length <= 0)
        missing.push('assigned users');
      if (missing.length > 0) {
        throw new BadRequestException(
          `Sub-property is missing required data: ${missing.join(', ')}`,
        );
      }

      // Validate polygon is inside parent
      if (property.parentProperty?.location?.locationPolygon && property.location?.locationPolygon) {
        const parent = turf.polygon(property.parentProperty.location.locationPolygon.coordinates);
        const sub = turf.polygon(property.location.locationPolygon.coordinates);
        if (!turf.booleanWithin(sub, parent)) {
          throw new BadRequestException(
            'The sub-property polygon is not fully inside the parent property polygon.',
          );
        }
      }

      // Validate polygon for overlaps
      if (property.location?.locationPolygon) {
        const excludeIds = [property.id];
        if (property.parentProperty?.id) excludeIds.push(property.parentProperty.id);
        await this.validatePolygon(property.location.locationPolygon, excludeIds);
      }
    } else {
      const missing: string[] = [];
      if (!property.location?.address) missing.push('address');
      if (!property.location?.city) missing.push('city');
      if (!property.location?.state) missing.push('state');
      if (!property.certificationOfOccupancy)
        missing.push('certification of occupancy');
      if (!property.contractOfSale) missing.push('contract of sale');
      if (!property.surveyPlan) missing.push('survey plan');
      if (missing.length > 0) {
        throw new BadRequestException(
          `Property is missing required data: ${missing.join(', ')}`,
        );
      }

      // Validate polygon for overlaps
      if (property.location?.locationPolygon) {
        await this.validatePolygon(property.location.locationPolygon, [property.id]);
      }
    }
  }

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
      (property) => this.convertToLookupResponse(property, true),
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
      'company.user',
    ]);

    const isOwner = property.company.user.id === userId;
    const isNonUserRole = user.role !== UserRole.USER;
    const includeDocuments = isOwner || isNonUserRole;

    this.logger.log(
      `Retrieved property ${property.id} for user ${userId}`,
      PropertyService.name,
    );
    return this.convertToDto(property, includeDocuments);
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
      ],
    );

    const [properties, count] =
      await this.propertyRepository.findAndCount(findOptions);

    this.logger.log(
      `Retrieved company properties for company ${company.id} for user ${userId}`,
      PropertyService.name,
    );
    return PaginationAndSorting.getPaginateResult(
      properties,
      count,
      propertyQuery,
      (property) => this.convertToDto(property, includeDocuments),
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

    // Determine if user can view documents:
    // - Property owner can always see documents
    // - Non-USER roles (admin, etc.) can see documents
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
        'users',
        'users.profileImage',
      ],
    );

    const [properties, count] =
      await this.propertyRepository.findAndCount(findOptions);

    this.logger.log(
      `Retrieved sub-properties property ${property.id} for user ${userId}`,
      PropertyService.name,
    );
    return PaginationAndSorting.getPaginateResult(
      properties,
      count,
      propertyQuery,
      (subProperty) => this.convertToDto(subProperty, includeDocuments),
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

  // For dynamic map-loading of properties
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
    } = propertyQuery;

    const user: User = await this.userService.findById(userId);
    const isUser = user.role === UserRole.USER;

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

    if (isUser) {
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

    // Optimize based on zoom level
    if (zoom && zoom < 12) {
      // At low zoom levels, show only larger properties or simplified data
      queryBuilder = queryBuilder.andWhere('property.area > :minArea', {
        minArea: 10000,
      }); // 1 hectare
    }

    // Add spatial ordering (closest to center first)
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
        return this.convertToLookupResponse(property, !isUser);
      },
      true,
    );
  }

  async getPropertiesByLocation(
    userId: string,
    locationName: string,
    query: LocationQueryDto,
  ): Promise<PaginationAndSortingResult<PropertyLookupResponseDto>> {
    const { limit, propertyType, page, status } = query;

    const user: User = await this.userService.findById(userId);
    const isUser = user.role === UserRole.USER;

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

    if (propertyType) {
      queryBuilder = queryBuilder.andWhere(
        'property.propertyType = :propertyType',
        { propertyType },
      );
    }

    if (isUser) {
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
      .orderBy('property.area', 'DESC') // Show larger properties first
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
        return this.convertToLookupResponse(property, !isUser);
      },
      true,
    );
  }

  async getNearbyProperties(
    userId: string,
    query: NearbyQueryDto,
  ): Promise<PaginationAndSortingResult<PropertyLookupResponseDto>> {
    const { latitude, longitude, radiusKm, limit, page, status } = query;

    const user: User = await this.userService.findById(userId);
    const isUser = user.role === UserRole.USER;

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

    if (isUser) {
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
        return this.convertToLookupResponse(property, !isUser);
      },
      true,
    );
  }

  private async validatePolygon(
    polygon: Polygon,
    excludePropertyIds?: string[],
  ): Promise<void> {
    const polygonFeature = turf.feature(polygon);
    if (!turf.booleanValid(polygonFeature)) {
      throw new BadRequestException('Invalid polygon geometry provided');
    }

    await this.checkForOverlaps(polygon, excludePropertyIds);
  }

  private async checkForOverlaps(
    polygon: Polygon,
    excludePropertyIds?: string[],
  ): Promise<void> {
    let query = this.locationRepository
      .createQueryBuilder('location')
      .leftJoinAndSelect('location.property', 'property')
      .leftJoinAndSelect('property.company', 'company')
      .where(
        'ST_Intersects(location.locationPolygon, ST_GeomFromGeoJSON(:polygon))',
        {
          polygon: JSON.stringify(polygon),
        },
      )
      // Only check verified properties to avoid conflicts with drafts
      .andWhere('property.propertyVerificationStatus IN (:...statuses)', {
        statuses: [
          PropertyVerificationStatus.VERIFIED,
          PropertyVerificationStatus.PENDING,
        ],
      });

    // Exclude specified properties (self, parent, etc.)
    if (excludePropertyIds && excludePropertyIds.length > 0) {
      query = query.andWhere('property.id NOT IN (:...excludePropertyIds)', {
        excludePropertyIds,
      });
    }

    const overlappingLocations = await query.getMany();

    const detailedOverlaps: {
      property: any;
      overlapArea: number;
      overlapPercentage: number;
      intersection: any;
    }[] = [];
    for (const location of overlappingLocations) {
      const featureCollection = turf.featureCollection([
        turf.feature(polygon),
        turf.feature(location.locationPolygon),
      ]);
      const intersection = turf.intersect(featureCollection);

      if (intersection) {
        const overlapArea = turf.area(intersection);
        const overlapPercentage = (overlapArea / turf.area(polygon)) * 100;

        detailedOverlaps.push({
          property: location.property,
          overlapArea,
          overlapPercentage: Math.round(overlapPercentage * 100) / 100,
          intersection: intersection.geometry,
        });
      }
    }

    if (detailedOverlaps.length > 0) {
      const overlaps = detailedOverlaps.map((overlap) => ({
        propertyName: overlap.property.name,
        companyName: overlap.property.company.name,
        overlapArea: Math.round(overlap.overlapArea),
        overlapPercentage: overlap.overlapPercentage,
      }));

      throw new BadRequestException({
        message: 'Property boundaries overlap with existing properties',
        overlappingProperties: overlaps,
        totalOverlaps: overlaps.length,
      });
    }
  }

  private convertToLookupResponse(
    property: Property,
    isDetailed: boolean = false,
  ): PropertyLookupResponseDto {
    return {
      propertyId: property.id,
      name: property.name,
      pin: property.pin,
      description: property.description,
      propertyVerificationStatus: isDetailed
        ? property.propertyVerificationStatus
        : null,
      area: property.area,
      polygon: property.location.locationPolygon,
      address: property.location.address,
      city: property.location.city,
      state: property.location.state,
      propertyType: property.propertyType,
      isSubProperty: property.isSubProperty,
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
      company: !property.isSubProperty
        ? {
          companyId: property.company.id,
          companyVerificationStatus:
            property.company.companyVerificationStatus,
          proofOfAddressType: property.company.proofOfAddressType,
          profileImage: property.company.profileImage
            ? property.company.profileImage.url
            : null,
          name: property.company.name,
        }
        : null,
    };
  }

  public convertToDto(
    property: Property,
    includeDocuments: boolean = true,
  ): PropertyDto {
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
      // Only include documents if user is owner or has non-USER role
      certificationOfOccupancy:
        includeDocuments && property.certificationOfOccupancy
          ? property.certificationOfOccupancy.url
          : null,
      contractOfSale:
        includeDocuments && property.contractOfSale
          ? property.contractOfSale.url
          : null,
      surveyPlan:
        includeDocuments && property.surveyPlan
          ? property.surveyPlan.url
          : null,
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

  async adminOverrideProperty(
    propertyId: string,
    adminUserId: string,
    dto: import('../../model/request/admin-override-property.dto').AdminOverridePropertyDto,
  ): Promise<PropertyDto> {
    const admin: User = await this.userService.findById(adminUserId);

    if (admin.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('Only admins can override property details');
    }

    let property = await this.findById(propertyId, [
      'company',
      'location',
      'certificationOfOccupancy',
      'contractOfSale',
      'surveyPlan',
      'deedOfConveyance',
      'letterOfIntent',
      'company.user',
    ]);

    return this.dataSource.transaction(async (manager) => {
      if (dto.name) property.name = dto.name;
      if (dto.description) property.description = dto.description;
      if (dto.propertyType) property.propertyType = dto.propertyType as any;

      if (dto.address || dto.city || dto.state || dto.country) {
        if (!property.location) {
          property.location = manager.create(LocationEntity, { property });
        }
        if (dto.address) property.location.address = dto.address;
        if (dto.city) property.location.city = dto.city;
        if (dto.state) property.location.state = dto.state;
        if (dto.country) property.location.country = dto.country;
      }

      if (dto.polygon) {
        if (!property.location) {
          property.location = manager.create(LocationEntity, { property });
        }

        // Convert string to polygon if it's string explicitly
        let polygonObj = dto.polygon as any;
        if (typeof dto.polygon === 'string') {
          polygonObj = JSON.parse(dto.polygon);
        }

        await this.validatePolygon(polygonObj as Polygon, [property.id]);
        property.location.locationPolygon = polygonObj;
        property.area = turf.area(polygonObj);
      }

      if (property.location) {
        await manager.save(LocationEntity, property.location);
      }

      property = await manager.save(Property, property);

      this.logger.log(
        `Admin: ${admin.id} overrode property details for property ${property.id}`,
        PropertyService.name,
      );

      return this.convertToDto(property, true);
    });
  }
}
