import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as turf from '@turf/turf';
import { Polygon } from 'geojson';
import { EntityManager, Repository } from 'typeorm';
import { OtherDocumentRequestDto } from '../../model/request/create-property-request.dto';
import { FileEntity } from '../../model/entity/file.entity';
import { LocationEntity } from '../../model/entity/location.entity';
import { Property } from '../../model/entity/property.entity';
import { PropertyVerificationStatus } from '../../model/enum/property-verification-status.enum';
import { FileType } from '../../model/enum/file-type.enum';
import { PropertyDto } from '../../model/dto/property.dto';
import { PropertyLookupResponseDto } from '../../model/response/property-lookup-response.dto';
import { FileService } from '../file/file.service';

@Injectable()
export class PropertyHelperService {
  constructor(
    @InjectRepository(LocationEntity)
    private readonly locationRepository: Repository<LocationEntity>,
    private readonly fileService: FileService,
  ) {}

  async replaceOtherDocuments(
    property: Property,
    otherDocuments: OtherDocumentRequestDto[],
    manager: EntityManager,
  ): Promise<void> {
    this.validateOtherDocuments(otherDocuments);

    const fileRepository = manager.getRepository(FileEntity);

    if (property.otherDocuments?.length) {
      await Promise.all(
        property.otherDocuments.map((document) =>
          this.fileService.updateFile(
            document,
            null,
            FileType.PROPERTY_OTHER_DOCUMENT,
            manager,
          ),
        ),
      );
    }

    property.otherDocuments = [];

    if (otherDocuments.length === 0) {
      return;
    }

    property.otherDocuments = await Promise.all(
      otherDocuments.map(async (document) => {
        const linkedDocument = await this.fileService.updateWithUrl(
          document.url,
          property,
          FileType.PROPERTY_OTHER_DOCUMENT,
          manager,
        );
        linkedDocument.otherDocumentLabel = document.label.trim();
        return fileRepository.save(linkedDocument);
      }),
    );
  }

  validateOtherDocuments(otherDocuments: OtherDocumentRequestDto[]): void {
    const labels = new Set<string>();
    const urls = new Set<string>();

    for (const document of otherDocuments) {
      const label = document.label.trim();
      if (!label) {
        throw new BadRequestException('Other document label is required');
      }

      if (labels.has(label)) {
        throw new BadRequestException(
          'Other document labels must be unique per property',
        );
      }

      if (urls.has(document.url)) {
        throw new BadRequestException('Other document URLs must be unique');
      }

      labels.add(label);
      urls.add(document.url);
    }
  }

  async validatePropertyCompleteness(property: Property): Promise<void> {
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

      if (
        property.parentProperty?.location?.locationPolygon &&
        property.location?.locationPolygon
      ) {
        const parent = turf.polygon(
          property.parentProperty.location.locationPolygon.coordinates,
        );
        const sub = turf.polygon(property.location.locationPolygon.coordinates);
        if (!turf.booleanWithin(sub, parent)) {
          throw new BadRequestException(
            'The sub-property polygon is not fully inside the parent property polygon.',
          );
        }
      }

      if (property.location?.locationPolygon) {
        const excludeIds = [property.id];
        if (property.parentProperty?.id)
          excludeIds.push(property.parentProperty.id);
        await this.validatePolygon(
          property.location.locationPolygon,
          excludeIds,
        );
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

      if (property.location?.locationPolygon) {
        await this.validatePolygon(property.location.locationPolygon, [
          property.id,
        ]);
      }
    }
  }

  async validatePolygon(
    polygon: Polygon,
    excludePropertyIds?: string[],
    manager?: EntityManager,
  ): Promise<void> {
    const polygonFeature = turf.feature(polygon);
    if (!turf.booleanValid(polygonFeature)) {
      throw new BadRequestException('Invalid polygon geometry provided');
    }

    await this.checkForOverlaps(polygon, excludePropertyIds, manager);
  }

  async checkForOverlaps(
    polygon: Polygon,
    excludePropertyIds?: string[],
    manager?: EntityManager,
  ): Promise<void> {
    const locationRepository = manager
      ? manager.getRepository(LocationEntity)
      : this.locationRepository;

    let query = locationRepository
      .createQueryBuilder('location')
      .leftJoinAndSelect('location.property', 'property')
      .leftJoinAndSelect('property.company', 'company')
      .where(
        'ST_Intersects(location.locationPolygon, ST_GeomFromGeoJSON(:polygon))',
        {
          polygon: JSON.stringify(polygon),
        },
      )
      .andWhere('property.propertyVerificationStatus IN (:...statuses)', {
        statuses: [
          PropertyVerificationStatus.VERIFIED,
          PropertyVerificationStatus.PENDING,
          PropertyVerificationStatus.PENDING_REVERIFICATION,
        ],
      });

    if (excludePropertyIds && excludePropertyIds.length > 0) {
      query = query.andWhere('property.id NOT IN (:...excludePropertyIds)', {
        excludePropertyIds,
      });
    }

    const overlappingLocations = await query.getMany();

    const detailedOverlaps: {
      property: Property;
      overlapArea: number;
      overlapPercentage: number;
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

  convertToLookupResponse(
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
      polygon: property.location?.locationPolygon ?? null,
      address: property.location?.address ?? null,
      city: property.location?.city ?? null,
      state: property.location?.state ?? null,
      propertyType: property.propertyType,
      isSubProperty: property.isSubProperty,
      isPublic: property.isPublic,
      users: property.isSubProperty
        ? (property.users || []).map((user) => {
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

  convertToDto(
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
      polygon: property.location?.locationPolygon ?? null,
      address: property.location?.address ?? null,
      city: property.location?.city ?? null,
      state: property.location?.state ?? null,
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
      otherDocuments:
        includeDocuments && property.otherDocuments
          ? property.otherDocuments.map((document) => ({
              label: document.otherDocumentLabel as string,
              url: document.url,
            }))
          : null,
      users: property.isSubProperty
        ? (property.users || []).map((user) => {
            return {
              userId: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              profileImageUrl: user.profileImage ? user.profileImage.url : null,
            };
          })
        : null,
      proposedUsers: null,
    };
  }
}
