import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as turf from '@turf/turf';
import { Polygon } from 'geojson';
import { EntityManager, In, Repository } from 'typeorm';
import {
  ACTIVE_VERSION_STATUSES,
  VersionDocumentSlot,
} from '../../../model/data/property-version.data';
import { OtherDocumentRequestDto } from '../../../model/request/create-property-request.dto';
import { UpdatePropertyRequestDto } from '../../../model/request/update-property-request.dto';
import { FileEntity } from '../../../model/entity/file.entity';
import { LocationEntity } from '../../../model/entity/location.entity';
import { Property } from '../../../model/entity/property.entity';
import { PropertyVerificationVersion } from '../../../model/entity/property-verification-version.entity';
import { PropertyVerificationVersionOtherDocument } from '../../../model/entity/property-verification-version-other-document.entity';
import { User } from '../../../model/entity/user.entity';
import { FileType } from '../../../model/enum/file-type.enum';
import { PropertyVerificationStatus } from '../../../model/enum/property-verification-status.enum';
import { FileService } from '../../file/file.service';
import { PropertyHelperService } from '../property-helper.service';

@Injectable()
export class PropertyVersionService {
  constructor(
    @InjectRepository(PropertyVerificationVersion)
    private readonly versionRepository: Repository<PropertyVerificationVersion>,
    private readonly fileService: FileService,
    private readonly propertyHelper: PropertyHelperService,
  ) {}

  hasVersionedChanges(dto: UpdatePropertyRequestDto): boolean {
    return [
      'propertyType',
      'address',
      'city',
      'state',
      'polygon',
      'certificationOfOccupancy',
      'contractOfSale',
      'surveyPlan',
      'letterOfIntent',
      'deedOfConveyance',
      'otherDocuments',
    ].some((field) => Object.prototype.hasOwnProperty.call(dto, field));
  }

  hasUserChanges(property: Property, dto: UpdatePropertyRequestDto): boolean {
    if (
      !Object.prototype.hasOwnProperty.call(dto, 'users') ||
      dto.users === null ||
      dto.users === undefined
    ) {
      return false;
    }

    if (!property.isSubProperty) {
      throw new BadRequestException(
        'Users can only be assigned to sub-properties',
      );
    }
    if (dto.users.length === 0) {
      throw new BadRequestException(
        'A sub-property must have at least one assigned user',
      );
    }

    const currentEmails = this.normalizeEmails(
      (property.users || []).map((user) => user.email),
    );
    const requestedEmails = this.normalizeEmails(dto.users);
    return (
      currentEmails.length !== requestedEmails.length ||
      currentEmails.some((email, index) => email !== requestedEmails[index])
    );
  }

  async ensureNoActiveVersion(
    property: Property,
    manager: EntityManager,
  ): Promise<void> {
    const activeVersionExists = await manager
      .getRepository(PropertyVerificationVersion)
      .exists({
        where: {
          property: { id: property.id },
          status: In(ACTIVE_VERSION_STATUSES),
        },
      });

    if (activeVersionExists) {
      throw new BadRequestException(
        'Property already has an active verification version',
      );
    }
  }

  async findActiveVersion(
    propertyId: string,
    manager?: EntityManager,
  ): Promise<PropertyVerificationVersion | null> {
    const repo = manager
      ? manager.getRepository(PropertyVerificationVersion)
      : this.versionRepository;

    return repo.findOne({
      where: {
        property: { id: propertyId },
        status: In(ACTIVE_VERSION_STATUSES),
      },
      relations: this.versionRelations(),
      order: { createdAt: 'DESC' },
    });
  }

  async createSubmittedVersion(
    property: Property,
    manager: EntityManager,
  ): Promise<PropertyVerificationVersion> {
    await this.ensureNoActiveVersion(property, manager);
    return this.createVersionSnapshot(
      property,
      {},
      manager,
      PropertyVerificationStatus.PENDING,
    );
  }

  async createUpdateVersion(
    property: Property,
    dto: UpdatePropertyRequestDto,
    manager: EntityManager,
  ): Promise<PropertyVerificationVersion> {
    await this.ensureNoActiveVersion(property, manager);
    const initialStatus =
      property.propertyVerificationStatus ===
      PropertyVerificationStatus.VERIFIED
        ? PropertyVerificationStatus.PENDING_REVERIFICATION
        : PropertyVerificationStatus.PENDING;

    return this.createVersionSnapshot(property, dto, manager, initialStatus);
  }

  async markActiveVersionInReview(
    property: Property,
    manager?: EntityManager,
  ): Promise<void> {
    const version = await this.findActiveVersion(property.id, manager);
    if (!version) return;

    version.status = PropertyVerificationStatus.IN_REVIEW;
    this.appendStatusHistory(version, PropertyVerificationStatus.IN_REVIEW);
    await this.getVersionRepository(manager).save(version);
  }

  async rejectActiveVersion(
    property: Property,
    comments: string | undefined,
    manager?: EntityManager,
  ): Promise<void> {
    const version = await this.findActiveVersion(property.id, manager);
    if (!version) return;

    version.status = PropertyVerificationStatus.REJECTED;
    version.adminComments = comments || null;
    this.appendStatusHistory(version, PropertyVerificationStatus.REJECTED);
    await this.getVersionRepository(manager).save(version);
  }

  async approveActiveVersion(
    property: Property,
    manager: EntityManager,
  ): Promise<PropertyVerificationVersion | null> {
    const version = await this.findActiveVersion(property.id, manager);
    if (!version) return null;

    await this.applyVersionToProperty(property, version, manager);

    version.status = PropertyVerificationStatus.VERIFIED;
    this.appendStatusHistory(version, PropertyVerificationStatus.VERIFIED);
    await manager.save(PropertyVerificationVersion, version);

    property.currentVerificationVersion = version;
    return version;
  }

  private async createVersionSnapshot(
    property: Property,
    dto: Partial<UpdatePropertyRequestDto>,
    manager: EntityManager,
    initialStatus: PropertyVerificationStatus,
  ): Promise<PropertyVerificationVersion> {
    const locationPolygon = this.resolveValue(
      dto,
      'polygon',
      property.location?.locationPolygon,
    );
    const area = locationPolygon ? turf.area(locationPolygon) : property.area;

    const users = property.isSubProperty
      ? await this.resolveVersionUsers(property, dto, manager)
      : [];

    const version = manager.create(PropertyVerificationVersion, {
      property: { id: property.id } as Property,
      status: initialStatus,
      propertyType:
        this.resolveValue(dto, 'propertyType', property.propertyType) ||
        property.propertyType,
      address: this.resolveValue(dto, 'address', property.location?.address),
      city: this.resolveValue(dto, 'city', property.location?.city),
      state: this.resolveValue(dto, 'state', property.location?.state),
      locationPolygon,
      area,
      statusHistory: [{ status: initialStatus, changedAt: new Date() }],
      users: users.map((user) => ({ id: user.id }) as User),
    });

    const savedVersion = await manager.save(
      PropertyVerificationVersion,
      version,
    );

    await this.attachNamedDocument(
      savedVersion,
      'certificationOfOccupancy',
      FileType.CERTIFICATE_OF_OCCUPANCY,
      this.resolveDocumentUrl(
        dto,
        'certificationOfOccupancy',
        property.certificationOfOccupancy,
      ),
      manager,
    );
    await this.attachNamedDocument(
      savedVersion,
      'contractOfSale',
      FileType.CONTRACT_OF_SALE,
      this.resolveDocumentUrl(dto, 'contractOfSale', property.contractOfSale),
      manager,
    );
    await this.attachNamedDocument(
      savedVersion,
      'surveyPlan',
      FileType.SURVEY_PLAN,
      this.resolveDocumentUrl(dto, 'surveyPlan', property.surveyPlan),
      manager,
    );
    await this.attachNamedDocument(
      savedVersion,
      'letterOfIntent',
      FileType.LETTER_OF_INTENT,
      this.resolveDocumentUrl(dto, 'letterOfIntent', property.letterOfIntent),
      manager,
    );
    await this.attachNamedDocument(
      savedVersion,
      'deedOfConveyance',
      FileType.DEED_OF_CONVEYANCE,
      this.resolveDocumentUrl(
        dto,
        'deedOfConveyance',
        property.deedOfConveyance,
      ),
      manager,
    );

    const otherDocuments = Object.prototype.hasOwnProperty.call(
      dto,
      'otherDocuments',
    )
      ? dto.otherDocuments || []
      : this.mapExistingOtherDocuments(property.otherDocuments);
    await this.replaceVersionOtherDocuments(
      savedVersion,
      otherDocuments,
      manager,
    );

    const completeVersion = await manager.findOne(PropertyVerificationVersion, {
      where: { id: savedVersion.id },
      relations: this.versionRelations(),
    });
    if (!completeVersion) throw new NotFoundException('Version not found');

    this.validateVersionCompleteness(property, completeVersion);
    return completeVersion;
  }

  private async applyVersionToProperty(
    property: Property,
    version: PropertyVerificationVersion,
    manager: EntityManager,
  ): Promise<void> {
    property.propertyType = version.propertyType;
    property.area = version.area as number;

    if (!property.location) {
      property.location = manager.create(LocationEntity, { property });
    }
    property.location.address = version.address as string;
    property.location.city = version.city as string;
    property.location.state = version.state as string;
    property.location.locationPolygon = version.locationPolygon as Polygon;
    await manager.save(LocationEntity, property.location);

    await this.copyNamedDocumentToProperty(
      property,
      'certificationOfOccupancy',
      FileType.CERTIFICATE_OF_OCCUPANCY,
      version.certificationOfOccupancy,
      manager,
    );
    await this.copyNamedDocumentToProperty(
      property,
      'contractOfSale',
      FileType.CONTRACT_OF_SALE,
      version.contractOfSale,
      manager,
    );
    await this.copyNamedDocumentToProperty(
      property,
      'surveyPlan',
      FileType.SURVEY_PLAN,
      version.surveyPlan,
      manager,
    );
    await this.copyNamedDocumentToProperty(
      property,
      'letterOfIntent',
      FileType.LETTER_OF_INTENT,
      version.letterOfIntent,
      manager,
    );
    await this.copyNamedDocumentToProperty(
      property,
      'deedOfConveyance',
      FileType.DEED_OF_CONVEYANCE,
      version.deedOfConveyance,
      manager,
    );

    await this.copyOtherDocumentsToProperty(property, version, manager);
    if (property.isSubProperty) {
      property.users = version.users;
    }
  }

  private async attachNamedDocument(
    version: PropertyVerificationVersion,
    slot: VersionDocumentSlot,
    fileType: FileType,
    url: string | null,
    manager: EntityManager,
  ): Promise<void> {
    if (!url) return;

    const file = await this.findFileByUrl(url, fileType, manager);
    this.setVersionDocument(version, slot, file);
    await manager.save(PropertyVerificationVersion, version);
  }

  private async replaceVersionOtherDocuments(
    version: PropertyVerificationVersion,
    documents: OtherDocumentRequestDto[],
    manager: EntityManager,
  ): Promise<void> {
    this.propertyHelper.validateOtherDocuments(documents);
    await manager.delete(PropertyVerificationVersionOtherDocument, {
      version: { id: version.id },
    });

    for (const document of documents) {
      const file = await this.findFileByUrl(
        document.url,
        FileType.PROPERTY_OTHER_DOCUMENT,
        manager,
      );
      await manager.save(
        PropertyVerificationVersionOtherDocument,
        manager.create(PropertyVerificationVersionOtherDocument, {
          version,
          file,
          label: document.label.trim(),
        }),
      );
    }
  }

  private async copyNamedDocumentToProperty(
    property: Property,
    slot: VersionDocumentSlot,
    fileType: FileType,
    file: FileEntity | null,
    manager: EntityManager,
  ): Promise<void> {
    const existingFile = this.getPropertyFile(property, slot);
    if (existingFile && existingFile.id !== file?.id) {
      await this.fileService.updateFile(existingFile, null, fileType, manager);
    }

    if (!file) {
      this.setPropertyFile(property, slot, null);
      return;
    }

    if (this.getPropertyDocument(file, slot)?.id !== property.id) {
      await this.fileService.updateFile(file, property, fileType, manager);
    }
    this.setPropertyFile(property, slot, file);
  }

  private async copyOtherDocumentsToProperty(
    property: Property,
    version: PropertyVerificationVersion,
    manager: EntityManager,
  ): Promise<void> {
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
    for (const document of version.otherDocuments || []) {
      if (document.file.otherDocumentProperty?.id !== property.id) {
        await this.fileService.updateFile(
          document.file,
          property,
          FileType.PROPERTY_OTHER_DOCUMENT,
          manager,
        );
      }
      document.file.otherDocumentLabel = document.label;
      await manager.save(FileEntity, document.file);
      property.otherDocuments.push(document.file);
    }
  }

  private validateVersionCompleteness(
    property: Property,
    version: PropertyVerificationVersion,
  ): void {
    const missing: string[] = [];
    if (!version.address) missing.push('address');
    if (!version.locationPolygon) missing.push('polygon');
    if (!version.contractOfSale) missing.push('contract of sale');
    if (!version.surveyPlan) missing.push('survey plan');

    if (property.isSubProperty) {
      if (!version.deedOfConveyance) missing.push('deed of conveyance');
      if (!version.users || version.users.length <= 0)
        missing.push('assigned users');
    } else {
      if (!version.city) missing.push('city');
      if (!version.state) missing.push('state');
      if (!version.certificationOfOccupancy)
        missing.push('certification of occupancy');
    }

    if (missing.length > 0) {
      throw new BadRequestException(
        `Property verification version is missing required data: ${missing.join(', ')}`,
      );
    }
  }

  private resolveValue<T, K extends keyof UpdatePropertyRequestDto>(
    dto: Partial<UpdatePropertyRequestDto>,
    key: K,
    currentValue: T | null | undefined,
  ): T | null {
    return Object.prototype.hasOwnProperty.call(dto, key)
      ? ((dto[key] as T | null | undefined) ?? null)
      : (currentValue ?? null);
  }

  private resolveDocumentUrl(
    dto: Partial<UpdatePropertyRequestDto>,
    key: VersionDocumentSlot,
    currentFile?: FileEntity | null,
  ): string | null {
    return Object.prototype.hasOwnProperty.call(dto, key)
      ? ((dto[key] as string | null | undefined) ?? null)
      : (currentFile?.url ?? null);
  }

  private mapExistingOtherDocuments(
    documents?: FileEntity[],
  ): OtherDocumentRequestDto[] {
    return (documents || []).map((document) => ({
      label: document.otherDocumentLabel as string,
      url: document.url,
    }));
  }

  private async resolveVersionUsers(
    property: Property,
    dto: Partial<UpdatePropertyRequestDto>,
    manager: EntityManager,
  ): Promise<User[]> {
    if (dto.users === null || dto.users === undefined) {
      return property.users || [];
    }

    const emails = [...new Set(dto.users)];
    if (emails.length === 0) {
      throw new BadRequestException(
        'A sub-property must have at least one assigned user',
      );
    }

    const users = await manager.find(User, {
      where: { email: In(emails) },
      relations: ['profileImage'],
    });
    const foundEmails = new Set(users.map((user) => user.email));
    const missingEmail = emails.find((email) => !foundEmails.has(email));
    if (missingEmail) {
      throw new NotFoundException(`User with email ${missingEmail} not found`);
    }
    return users;
  }

  private normalizeEmails(emails: string[]): string[] {
    return [...new Set(emails)].sort();
  }

  private async findFileByUrl(
    url: string,
    fileType: FileType,
    manager: EntityManager,
  ): Promise<FileEntity> {
    const file = await manager.findOne(FileEntity, {
      where: { url },
      relations: ['otherDocumentProperty'],
    });
    if (!file) throw new NotFoundException('File not found');
    if (file.fileType !== fileType) {
      throw new BadRequestException('File type do not match');
    }
    return file;
  }

  private getPropertyDocument(
    file: FileEntity,
    slot: VersionDocumentSlot,
  ): Property | null {
    switch (slot) {
      case 'certificationOfOccupancy':
        return file.certificationOfOccupancy;
      case 'contractOfSale':
        return file.contractOfSale;
      case 'surveyPlan':
        return file.surveyPlan;
      case 'letterOfIntent':
        return file.letterOfIntent;
      case 'deedOfConveyance':
        return file.deedOfConveyance;
    }
  }

  private getPropertyFile(
    property: Property,
    slot: VersionDocumentSlot,
  ): FileEntity | null {
    switch (slot) {
      case 'certificationOfOccupancy':
        return property.certificationOfOccupancy;
      case 'contractOfSale':
        return property.contractOfSale;
      case 'surveyPlan':
        return property.surveyPlan;
      case 'letterOfIntent':
        return property.letterOfIntent;
      case 'deedOfConveyance':
        return property.deedOfConveyance;
    }
  }

  private setPropertyFile(
    property: Property,
    slot: VersionDocumentSlot,
    file: FileEntity | null,
  ): void {
    switch (slot) {
      case 'certificationOfOccupancy':
        property.certificationOfOccupancy = file as FileEntity;
        return;
      case 'contractOfSale':
        property.contractOfSale = file as FileEntity;
        return;
      case 'surveyPlan':
        property.surveyPlan = file as FileEntity;
        return;
      case 'letterOfIntent':
        property.letterOfIntent = file as FileEntity;
        return;
      case 'deedOfConveyance':
        property.deedOfConveyance = file as FileEntity;
        return;
    }
  }

  private setVersionDocument(
    version: PropertyVerificationVersion,
    slot: VersionDocumentSlot,
    file: FileEntity,
  ): void {
    switch (slot) {
      case 'certificationOfOccupancy':
        version.certificationOfOccupancy = file;
        return;
      case 'contractOfSale':
        version.contractOfSale = file;
        return;
      case 'surveyPlan':
        version.surveyPlan = file;
        return;
      case 'letterOfIntent':
        version.letterOfIntent = file;
        return;
      case 'deedOfConveyance':
        version.deedOfConveyance = file;
        return;
    }
  }

  private getVersionRepository(
    manager?: EntityManager,
  ): Repository<PropertyVerificationVersion> {
    return manager
      ? manager.getRepository(PropertyVerificationVersion)
      : this.versionRepository;
  }

  private appendStatusHistory(
    version: PropertyVerificationVersion,
    status: PropertyVerificationStatus,
  ): void {
    if (!version.statusHistory) version.statusHistory = [];
    version.statusHistory.push({ status, changedAt: new Date() });
  }

  private versionRelations(): string[] {
    return [
      'property',
      'certificationOfOccupancy',
      'contractOfSale',
      'surveyPlan',
      'letterOfIntent',
      'deedOfConveyance',
      'otherDocuments',
      'otherDocuments.file',
      'otherDocuments.file.otherDocumentProperty',
      'users',
      'users.profileImage',
    ];
  }
}
