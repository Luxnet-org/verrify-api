import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { MyLoggerService } from '../logger/my-logger.service';
import { Property } from '../../model/entity/property.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
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
import { VerdictDto, VerdictType } from '../../model/request/verdict.dto';
import { CreateSubPropertyRequestDto } from '../../model/request/create-subproperty-request.dto';
import { Polygon } from 'geojson';
import { CompanyVerificationStatus } from '../../model/enum/company-verification-status.enum';
import { EmailEvent } from '../email/email-event.service';
import { EmailRequest } from '../../model/request/email-request.dto';
import { EmailType } from '../../model/enum/email-type.enum';
import { ConfigService } from '@nestjs/config';
import { ConfigInterface } from '../../config-module/configuration';
import { PropertyHelperService } from './property-helper.service';
import { PropertyGetService } from './property-get.service';
import { PropertyVersionService } from './version/property-version.service';

@Injectable()
export class PropertyService {
  private readonly logger: MyLoggerService = new MyLoggerService(
    PropertyService.name,
  );

  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    private readonly companyService: CompanyService,
    private readonly fileService: FileService,
    private readonly userService: UserService,
    private readonly emailEvent: EmailEvent,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService<ConfigInterface>,
    private readonly propertyHelper: PropertyHelperService,
    private readonly propertyGetService: PropertyGetService,
    private readonly propertyVersionService: PropertyVersionService,
  ) {}

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

    await this.propertyHelper.validatePolygon(propertyRequest.polygon);

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
        property.certificationOfOccupancy =
          await this.fileService.updateWithUrl(
            propertyRequest.certificationOfOccupancy,
            property,
            FileType.CERTIFICATE_OF_OCCUPANCY,
            manager,
          );
      }

      if (propertyRequest.contractOfSale) {
        property.contractOfSale = await this.fileService.updateWithUrl(
          propertyRequest.contractOfSale,
          property,
          FileType.CONTRACT_OF_SALE,
          manager,
        );
      }

      if (propertyRequest.surveyPlan) {
        property.surveyPlan = await this.fileService.updateWithUrl(
          propertyRequest.surveyPlan,
          property,
          FileType.SURVEY_PLAN,
          manager,
        );
      }

      if (propertyRequest.letterOfIntent) {
        property.letterOfIntent = await this.fileService.updateWithUrl(
          propertyRequest.letterOfIntent,
          property,
          FileType.LETTER_OF_INTENT,
          manager,
        );
      }

      if (propertyRequest.otherDocuments) {
        await this.propertyHelper.replaceOtherDocuments(
          property,
          propertyRequest.otherDocuments,
          manager,
        );
      }

      if (propertyRequest.isSubmitted) {
        await this.propertyVersionService.createSubmittedVersion(
          property,
          manager,
        );
        property.propertyVerificationStatus =
          PropertyVerificationStatus.PENDING;
        property.reviewUser = null;
        property.reviewedAt = null;
        property.verifiedAt = null;
        property.verificationMessage = null;
        property = await manager.save(Property, property);
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
    const property: Property = await this.propertyGetService.findById(
      propertyId,
      ['company', 'location', 'company.user'],
    );

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

    if (!property.location?.locationPolygon) {
      throw new BadRequestException(
        'Parent property must have a verified boundary before creating a sub-property.',
      );
    }
    const parentLocation = property.location;

    const parent = turf.polygon(parentLocation.locationPolygon.coordinates);
    const sub = turf.polygon(propertyRequest.polygon.coordinates);

    const isInside = turf.booleanWithin(sub, parent);
    if (!isInside) {
      throw new BadRequestException(
        'The sub-property polygon is not fully inside the parent property polygon.',
      );
    }

    await this.propertyHelper.validatePolygon(propertyRequest.polygon, [
      property.id,
    ]);

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
        location.city = parentLocation.city;
        location.state = parentLocation.state;
      }
      await manager.save(location);
      newProperty.location = location;

      if (propertyRequest.deedOfConveyance) {
        newProperty.deedOfConveyance = await this.fileService.updateWithUrl(
          propertyRequest.deedOfConveyance,
          newProperty,
          FileType.DEED_OF_CONVEYANCE,
          manager,
        );
      }

      if (propertyRequest.contractOfSale) {
        newProperty.contractOfSale = await this.fileService.updateWithUrl(
          propertyRequest.contractOfSale,
          newProperty,
          FileType.CONTRACT_OF_SALE,
          manager,
        );
      }

      if (propertyRequest.surveyPlan) {
        newProperty.surveyPlan = await this.fileService.updateWithUrl(
          propertyRequest.surveyPlan,
          newProperty,
          FileType.SURVEY_PLAN,
          manager,
        );
      }

      if (propertyRequest.otherDocuments) {
        await this.propertyHelper.replaceOtherDocuments(
          newProperty,
          propertyRequest.otherDocuments,
          manager,
        );
      }

      if (propertyRequest.isSubmitted) {
        await this.propertyVersionService.createSubmittedVersion(
          newProperty,
          manager,
        );
        newProperty.propertyVerificationStatus =
          PropertyVerificationStatus.PENDING;
        newProperty.reviewUser = null;
        newProperty.reviewedAt = null;
        newProperty.verifiedAt = null;
        newProperty.verificationMessage = null;
        newProperty = await manager.save(Property, newProperty);
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

    let property: Property = await this.propertyGetService.findById(
      propertyId,
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
        'currentVersion',
      ],
    );

    const isVisibilityOnlyUpdate =
      Object.keys(propertyRequest).length > 0 &&
      Object.keys(propertyRequest).every((key) => key === 'isPublic');
    const isActiveVerificationStatus =
      property.propertyVerificationStatus ===
        PropertyVerificationStatus.PENDING ||
      property.propertyVerificationStatus ===
        PropertyVerificationStatus.PENDING_REVERIFICATION ||
      property.propertyVerificationStatus ===
        PropertyVerificationStatus.IN_REVIEW;

    if (isActiveVerificationStatus && !isVisibilityOnlyUpdate) {
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
      const hasUserChanges = this.propertyVersionService.hasUserChanges(
        property,
        propertyRequest,
      );
      const hasVersionedChanges =
        this.propertyVersionService.hasVersionedChanges(propertyRequest) ||
        hasUserChanges;

      if (propertyRequest.name) {
        property.name = propertyRequest.name;
      }

      if (propertyRequest.description) {
        property.description = propertyRequest.description;
      }

      if (propertyRequest.isPublic !== undefined) {
        const hasApprovedBaseline =
          property.propertyVerificationStatus ===
            PropertyVerificationStatus.VERIFIED ||
          property.currentVersion?.status ===
            PropertyVerificationStatus.VERIFIED;

        if (propertyRequest.isPublic && !hasApprovedBaseline) {
          throw new BadRequestException(
            'Property cannot be made public until it has an approved verification baseline',
          );
        }

        property.isPublic = propertyRequest.isPublic;
      }

      if (hasVersionedChanges) {
        if (
          propertyRequest.address &&
          (!propertyRequest.city || !propertyRequest.state)
        ) {
          throw new BadRequestException(
            'Please provide a city and state when address is modified',
          );
        }

        if (propertyRequest.polygon) {
          await this.propertyHelper.validatePolygon(
            propertyRequest.polygon,
            [property.id],
            manager,
          );
        }

        const version = await this.propertyVersionService.createUpdateVersion(
          property,
          propertyRequest,
          manager,
        );
        property.propertyVerificationStatus = version.status;
        property.reviewUser = null;
        property.reviewedAt = null;
        property.verifiedAt = null;
        property.verificationMessage = null;
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
    const property: Property = await this.propertyGetService.findById(
      propertyId,
      [
        'company',
        'company.user',
        'location',
        'certificationOfOccupancy',
        'contractOfSale',
        'surveyPlan',
        'deedOfConveyance',
        'otherDocuments',
        'users',
        'parentProperty',
        'parentProperty.location',
      ],
    );

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

    await this.dataSource.transaction(async (manager) => {
      await this.propertyVersionService.createSubmittedVersion(
        property,
        manager,
      );

      property.propertyVerificationStatus = PropertyVerificationStatus.PENDING;
      property.reviewUser = null;
      property.reviewedAt = null;
      property.verifiedAt = null;
      property.verificationMessage = null;

      await manager.save(Property, property);
    });

    // Send submission email
    const emailRequest: EmailRequest = {
      type: EmailType.PROPERTY_SUBMITTED,
      to: property.company.user.email,
      context: {
        name: property.company.user.firstName,
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

  async assignReview(propertyId: string, adminUserId: string): Promise<string> {
    const admin: User = await this.userService.findById(adminUserId);

    if (admin.role !== UserRole.ADMIN && admin.role !== UserRole.SUPER_ADMIN) {
      throw new UnauthorizedException('Only admins can assign reviews');
    }

    const property: Property = await this.propertyGetService.findById(
      propertyId,
      ['company', 'company.user'],
    );

    if (
      property.propertyVerificationStatus !==
        PropertyVerificationStatus.PENDING &&
      property.propertyVerificationStatus !==
        PropertyVerificationStatus.PENDING_REVERIFICATION
    ) {
      throw new BadRequestException(
        `Cannot assign review for property with status ${property.propertyVerificationStatus}. Only PENDING or PENDING_REVERIFICATION properties can be assigned for review.`,
      );
    }

    property.propertyVerificationStatus = PropertyVerificationStatus.IN_REVIEW;
    property.reviewUser = admin;
    property.reviewedAt = new Date();

    await this.dataSource.transaction(async (manager) => {
      await this.propertyVersionService.markActiveVersionInReview(
        property,
        manager,
      );
      await manager.save(Property, property);
    });

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
    const property: Property = await this.propertyGetService.findById(
      propertyId,
      [
        'company',
        'location',
        'company.user',
        'reviewUser',
        'certificationOfOccupancy',
        'contractOfSale',
        'surveyPlan',
        'deedOfConveyance',
        'otherDocuments',
        'users',
        'parentProperty',
        'parentProperty.location',
      ],
    );

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
      verdictDto.verdict === VerdictType.VERIFIED
        ? PropertyVerificationStatus.VERIFIED
        : PropertyVerificationStatus.REJECTED;

    property.propertyVerificationStatus = newStatus;
    property.verificationMessage = verdictDto.verificationMessage;
    property.verifiedAt = new Date();

    await this.dataSource.transaction(async (manager) => {
      if (newStatus === PropertyVerificationStatus.VERIFIED) {
        await this.propertyVersionService.approveActiveVersion(
          property,
          manager,
        );
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
      } else {
        await this.propertyVersionService.rejectActiveVersion(
          property,
          verdictDto.verificationMessage,
          manager,
        );
      }

      await manager.save(Property, property);
    });

    // Send verdict email
    const frontendUrl =
      this.configService.get('app.frontendHost', { infer: true }) ||
      'https://verrify.net';
    const locationStr = property.location
      ? [
          property.location.address,
          property.location.city,
          property.location.state,
        ]
          .filter(Boolean)
          .join(', ')
      : '';
    const emailRequest: EmailRequest = {
      type:
        newStatus === PropertyVerificationStatus.VERIFIED
          ? EmailType.PROPERTY_VERIFIED
          : EmailType.PROPERTY_REJECTED,
      to: property.company.user.email,
      context: {
        name: property.company.user.firstName,
        propertyName: property.name,
        location: locationStr,
        rejectionReason: verdictDto.verificationMessage,
        listingLink: `${frontendUrl}/user/dashboard/properties/${property.id}`,
        dashboardLink: `${frontendUrl}/user/dashboard/properties`,
      },
    };
    await this.emailEvent.sendEmailRequest(emailRequest);

    this.logger.log(
      `Property ${property.id} verdict: ${newStatus} by admin ${adminUserId}`,
    );
    return `Property ${property.id} has been ${newStatus.toLowerCase()}`;
  }

  public convertToDto(
    property: Property,
    includeDocuments: boolean = true,
  ): PropertyDto {
    return this.propertyHelper.convertToDto(property, includeDocuments);
  }

  async adminOverrideProperty(
    propertyId: string,
    adminUserId: string,
    dto: import('../../model/request/admin-override-property.dto').AdminOverridePropertyDto,
  ): Promise<PropertyDto> {
    const admin: User = await this.userService.findById(adminUserId);

    if (admin.role !== UserRole.ADMIN && admin.role !== UserRole.SUPER_ADMIN) {
      throw new UnauthorizedException(
        'Only admins can override property details',
      );
    }

    let property = await this.propertyGetService.findById(propertyId, [
      'company',
      'location',
      'certificationOfOccupancy',
      'contractOfSale',
      'surveyPlan',
      'deedOfConveyance',
      'letterOfIntent',
      'otherDocuments',
      'company.user',
    ]);

    return this.dataSource.transaction(async (manager) => {
      if (dto.name) property.name = dto.name;
      if (dto.description) property.description = dto.description;
      if (dto.propertyType) property.propertyType = dto.propertyType;

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
        let polygonObj: Polygon = dto.polygon as unknown as Polygon;
        if (typeof dto.polygon === 'string') {
          polygonObj = JSON.parse(dto.polygon) as Polygon;
        }

        await this.propertyHelper.validatePolygon(
          polygonObj,
          [property.id],
          manager,
        );
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
