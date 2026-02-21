import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { PropertyVerification } from '../../model/entity/property-verification.entity';
import { Property } from '../../model/entity/property.entity';
import { User } from '../../model/entity/user.entity';
import { VerificationStageStatus } from '../../model/enum/verification-stage-status.enum';
import { UpdatePropertyVerificationDto } from '../../model/request/update-property-verification.dto';
import { PropertyVerificationVerdictDto, PropertyVerificationVerdict } from '../../model/request/property-verification-verdict.dto';
import { PaginationAndSorting, PaginationQueryDto, PaginationAndSortingResult } from '../../utility/pagination-and-sorting';
import { PropertyVerificationStatus } from '../../model/enum/property-verification-status.enum';
import { LocationEntity } from '../../model/entity/location.entity';
import { InitiateVerificationDto } from '../../model/request/initiate-verification.dto';
import { EmailEvent } from '../email/email-event.service';
import { EmailType } from '../../model/enum/email-type.enum';
import { UserRole } from 'src/model/enum/role.enum';
import { UserService } from '../user/user.service';
import { FileService } from '../file/file.service';
import { FileType } from '../../model/enum/file-type.enum';
import { PropertyVerificationDto } from '../../model/dto/property-verification.dto';
import { PropertyService } from '../property/property.service';

@Injectable()
export class PropertyVerificationService {
    constructor(
        @InjectRepository(PropertyVerification)
        private readonly propertyVerificationRepository: Repository<PropertyVerification>,
        @InjectRepository(Property)
        private readonly propertyRepository: Repository<Property>,
        private readonly userService: UserService,
        @InjectRepository(LocationEntity)
        private readonly locationRepository: Repository<LocationEntity>,
        private readonly dataSource: DataSource,
        private readonly emailEvent: EmailEvent,
        private readonly fileService: FileService,
        private readonly propertyService: PropertyService,
    ) { }

    async initiateVerification(dto: InitiateVerificationDto, userId: string): Promise<PropertyVerificationDto> {
        return await this.dataSource.transaction(async (manager) => {
            let property: Property | null = null;

            if (dto.propertyId) {
                property = await manager.findOne(Property, {
                    where: { id: dto.propertyId },
                    relations: ['company', 'company.user']
                });

                if (!property) {
                    throw new NotFoundException('Property not found');
                }

                // If an existing property is provided, ensure there isn't already an active verification
                const activeVerification = await manager.findOne(PropertyVerification, {
                    where: {
                        property: { id: dto.propertyId },
                        stage: In([
                            VerificationStageStatus.INITIATED,
                            VerificationStageStatus.PENDING_ACCEPTANCE,
                            VerificationStageStatus.VERIFICATION_ACCEPTED,
                            VerificationStageStatus.PENDING_PAYMENT,
                            VerificationStageStatus.PAYMENT_VERIFIED,
                            VerificationStageStatus.STAGE_1,
                            VerificationStageStatus.STAGE_2,
                            VerificationStageStatus.STAGE_3
                        ])
                    }
                });

                if (activeVerification) {
                    throw new BadRequestException('An active verification request already exists for this property');
                }
            } else {
                // Create a new unverified property and location
                let location = new LocationEntity();
                location.address = dto.address || '';
                location.city = dto.city || '';
                location.state = dto.state || '';
                location.country = dto.country || '';
                if (dto.polygon) {
                    location.locationPolygon = dto.polygon;
                }

                // Save location to get its ID before assigning to property
                location = await manager.save(LocationEntity, location);

                property = manager.create(Property, {
                    name: dto.name || 'Unverified Property',
                    description: dto.description || '',
                    propertyType: dto.propertyType,
                    propertyVerificationStatus: PropertyVerificationStatus.NOT_VERIFIED,
                    isPublic: false, // Don't show fully on map until verified (or decide based on logic)
                    location: location,
                });
                property = await manager.save(Property, property);
            }

            const user = await manager.findOne(User, { where: { id: userId } });
            if (!user) {
                throw new NotFoundException('User not found');
            }

            const verification = manager.create(PropertyVerification, {
                property: property,
                user: user,
                stage: VerificationStageStatus.INITIATED,
            });

            const savedVerification = await manager.save(PropertyVerification, verification);

            if (dto.verificationFiles && dto.verificationFiles.length > 0) {
                await Promise.all(dto.verificationFiles.map(url =>
                    this.fileService.updateWithUrl(url, savedVerification, FileType.VERIFICATION_DOCUMENT)
                ));
            }

            const completeVerification = await manager.findOne(PropertyVerification, {
                where: { id: savedVerification.id },
                relations: ['property', 'property.company', 'property.location', 'user', 'verificationFiles', 'adminStageFiles']
            });

            return this.convertToDto(completeVerification!);
        });
    }

    async updateVerification(verificationId: string, userId: string, dto: UpdatePropertyVerificationDto): Promise<PropertyVerificationDto> {
        return await this.dataSource.transaction(async (manager) => {
            const verification = await manager.findOne(PropertyVerification, {
                where: { id: verificationId },
                relations: ['property', 'property.company', 'property.location', 'user']
            });

            if (!verification) {
                throw new NotFoundException('Verification request not found');
            }

            if (verification.user.id !== userId) {
                throw new UnauthorizedException('You do not have permission to access this verification request');
            }

            if (verification.stage !== VerificationStageStatus.INITIATED) {
                throw new BadRequestException('Verification request can only be updated while in INITIATED stage');
            }

            if (dto.propertyId) {
                if (verification.property.id !== dto.propertyId) {
                    const newProperty = await manager.findOne(Property, {
                        where: { id: dto.propertyId },
                        relations: ['company', 'company.user']
                    });
                    if (!newProperty) {
                        throw new NotFoundException('New property not found');
                    }
                    const activeVerification = await manager.findOne(PropertyVerification, {
                        where: {
                            property: { id: dto.propertyId },
                            stage: In([
                                VerificationStageStatus.INITIATED,
                                VerificationStageStatus.PENDING_ACCEPTANCE,
                                VerificationStageStatus.VERIFICATION_ACCEPTED,
                                VerificationStageStatus.PENDING_PAYMENT,
                                VerificationStageStatus.PAYMENT_VERIFIED,
                                VerificationStageStatus.STAGE_1,
                                VerificationStageStatus.STAGE_2,
                                VerificationStageStatus.STAGE_3
                            ])
                        }
                    });

                    if (activeVerification) {
                        throw new BadRequestException('An active verification request already exists for this new property');
                    }
                    verification.property = newProperty;
                }
            } else {
                const prop = verification.property;
                if (prop.propertyVerificationStatus === PropertyVerificationStatus.NOT_VERIFIED) {
                    let propertyUpdated = false;

                    if (dto.name !== undefined) { prop.name = dto.name; propertyUpdated = true; }
                    if (dto.description !== undefined) { prop.description = dto.description; propertyUpdated = true; }
                    if (dto.propertyType !== undefined) { prop.propertyType = dto.propertyType; propertyUpdated = true; }

                    if (propertyUpdated) {
                        await manager.save(Property, prop);
                    }

                    if (prop.location) {
                        let locationUpdated = false;
                        if (dto.address !== undefined) { prop.location.address = dto.address; locationUpdated = true; }
                        if (dto.city !== undefined) { prop.location.city = dto.city; locationUpdated = true; }
                        if (dto.state !== undefined) { prop.location.state = dto.state; locationUpdated = true; }
                        if (dto.country !== undefined) { prop.location.country = dto.country; locationUpdated = true; }
                        if (dto.polygon !== undefined) { prop.location.locationPolygon = dto.polygon; locationUpdated = true; }

                        if (locationUpdated) {
                            await manager.save(LocationEntity, prop.location);
                        }
                    }
                }
            }

            const savedVerification = await manager.save(PropertyVerification, verification);

            if (dto.verificationFiles && dto.verificationFiles.length > 0) {
                await Promise.all(dto.verificationFiles.map(url =>
                    this.fileService.updateWithUrl(url, savedVerification, FileType.VERIFICATION_DOCUMENT)
                ));
            }

            const completeVerification = await manager.findOne(PropertyVerification, {
                where: { id: savedVerification.id },
                relations: ['property', 'property.company', 'property.location', 'user', 'verificationFiles', 'adminStageFiles']
            });

            return this.convertToDto(completeVerification!);
        });
    }

    async submitVerification(verificationId: string, userId: string): Promise<PropertyVerificationDto> {
        const verification = await this.getVerificationOrThrow(verificationId, userId);

        if (verification.stage !== VerificationStageStatus.INITIATED) {
            throw new BadRequestException('Verification request must be in INITIATED stage to be submitted');
        }

        verification.stage = VerificationStageStatus.PENDING_ACCEPTANCE;

        // Optionally update the core property status to pending as well
        if (verification.property.propertyVerificationStatus === PropertyVerificationStatus.NOT_VERIFIED) {
            verification.property.propertyVerificationStatus = PropertyVerificationStatus.PENDING;
            await this.propertyRepository.save(verification.property);
        }

        const savedVerification = await this.propertyVerificationRepository.save(verification);
        return this.convertToDto(savedVerification);
    }

    async getVerification(verificationId: string, userId: string): Promise<PropertyVerificationDto> {
        const verification = await this.getVerificationOrThrow(verificationId, userId);
        return this.convertToDto(verification);
    }

    async getMyVerifications(userId: string, queryDto: PaginationQueryDto): Promise<PaginationAndSortingResult<PropertyVerificationDto>> {
        const findOptions = PaginationAndSorting.createFindOptions<PropertyVerification>(
            null,
            queryDto,
            { user: { id: userId } } as any,
            {},
            ['property', 'property.location', 'verificationFiles', 'adminStageFiles']
        );

        const [items, total] = await this.propertyVerificationRepository.findAndCount(findOptions);

        return PaginationAndSorting.getPaginateResult(
            items,
            total,
            queryDto,
            (item: PropertyVerification) => this.convertToDto(item)
        );
    }

    async assignReview(verificationId: string, adminUserId: string): Promise<PropertyVerificationDto> {
        const admin: User = await this.userService.findById(adminUserId);

        if (admin.role !== UserRole.ADMIN) {
            throw new UnauthorizedException('Only admins can assign reviews');
        }

        const verification = await this.propertyVerificationRepository.findOne({
            where: { id: verificationId },
            relations: ['property', 'user', 'reviewUser']
        });

        if (!verification) throw new NotFoundException('Verification request not found');

        if (verification.stage !== VerificationStageStatus.PENDING_ACCEPTANCE) {
            throw new BadRequestException('Verification request must be in PENDING_ACCEPTANCE stage to be assigned');
        }

        if (verification.reviewUser) {
            throw new BadRequestException('Verification request is already assigned to an admin');
        }

        verification.stage = VerificationStageStatus.IN_REVIEW;
        verification.reviewUser = admin;
        verification.reviewedAt = new Date();

        const savedVerification = await this.propertyVerificationRepository.save(verification);
        return this.convertToDto(savedVerification);
    }

    async assignVerdict(verificationId: string, adminUserId: string, dto: PropertyVerificationVerdictDto): Promise<PropertyVerificationDto> {
        const verification = await this.propertyVerificationRepository.findOne({
            where: { id: verificationId },
            relations: ['property', 'user', 'reviewUser']
        });
        if (!verification) throw new NotFoundException('Verification request not found');

        if (verification.stage !== VerificationStageStatus.IN_REVIEW) {
            throw new BadRequestException('Request must be in IN_REVIEW stage');
        }

        if (!verification.reviewUser || verification.reviewUser.id !== adminUserId) {
            throw new UnauthorizedException('You are not the assigned reviewing admin for this request');
        }

        if (dto.verdict === PropertyVerificationVerdict.ACCEPTED) {
            verification.stage = VerificationStageStatus.VERIFICATION_ACCEPTED;
            if (dto.comments) verification.adminComments = dto.comments;
            const savedVerification = await this.propertyVerificationRepository.save(verification);

            // Notify User
            await this.emailEvent.sendEmailRequest({
                type: EmailType.VERIFICATION_PIPELINE_UPDATE,
                to: savedVerification.user.email,
                subject: 'Verification Request Accepted',
                context: {
                    firstName: savedVerification.user.firstName,
                    message: `Your verification request has been reviewed and accepted. Please proceed to payment. ${dto.comments ? 'Comments: ' + dto.comments : ''}`
                }
            });

            return this.convertToDto(savedVerification);
        } else {
            verification.stage = VerificationStageStatus.VERIFICATION_REJECTED;
            if (dto.comments) verification.adminComments = dto.comments;

            verification.property.propertyVerificationStatus = PropertyVerificationStatus.NOT_VERIFIED;
            await this.propertyRepository.save(verification.property);

            const savedVerification = await this.propertyVerificationRepository.save(verification);

            await this.emailEvent.sendEmailRequest({
                type: EmailType.VERIFICATION_PIPELINE_UPDATE,
                to: savedVerification.user.email,
                subject: 'Verification Request Rejected',
                context: {
                    firstName: savedVerification.user.firstName,
                    message: `Unfortunately, your request to verify property was rejected. Reason: ${dto.comments || 'N/A'}`
                }
            });

            return this.convertToDto(savedVerification);
        }
    }

    async adminAdvanceStage(verificationId: string, adminUserId: string, files?: string[], comments?: string): Promise<PropertyVerificationDto> {
        const verification = await this.propertyVerificationRepository.findOne({
            where: { id: verificationId },
            relations: ['property', 'user', 'reviewUser']
        });
        if (!verification) throw new NotFoundException('Verification request not found');

        if (verification.reviewUser && verification.reviewUser.id !== adminUserId) {
            throw new UnauthorizedException('You are not the assigned reviewing admin for this request');
        }

        const transitions: Record<VerificationStageStatus, VerificationStageStatus> = {
            [VerificationStageStatus.PAYMENT_VERIFIED]: VerificationStageStatus.STAGE_1,
            [VerificationStageStatus.STAGE_1]: VerificationStageStatus.STAGE_2,
            [VerificationStageStatus.STAGE_2]: VerificationStageStatus.STAGE_3,
            [VerificationStageStatus.STAGE_3]: VerificationStageStatus.VERIFICATION_COMPLETE,
            [VerificationStageStatus.INITIATED]: VerificationStageStatus.INITIATED, // Not allowed to advance
            [VerificationStageStatus.PENDING_ACCEPTANCE]: VerificationStageStatus.PENDING_ACCEPTANCE,
            [VerificationStageStatus.IN_REVIEW]: VerificationStageStatus.IN_REVIEW,
            [VerificationStageStatus.VERIFICATION_ACCEPTED]: VerificationStageStatus.VERIFICATION_ACCEPTED,
            [VerificationStageStatus.VERIFICATION_REJECTED]: VerificationStageStatus.VERIFICATION_REJECTED,
            [VerificationStageStatus.PENDING_PAYMENT]: VerificationStageStatus.PENDING_PAYMENT,
            [VerificationStageStatus.VERIFICATION_COMPLETE]: VerificationStageStatus.VERIFICATION_COMPLETE,
        };

        const nextStage = transitions[verification.stage];
        if (nextStage === verification.stage && verification.stage !== VerificationStageStatus.VERIFICATION_COMPLETE) {
            throw new BadRequestException(`Cannot artificially advance stage from ${verification.stage}`);
        }

        verification.stage = nextStage;
        if (comments) verification.adminComments = comments;
        if (files && files.length > 0) {
            await Promise.all(files.map(url =>
                this.fileService.updateWithUrl(url, verification, FileType.ADMIN_STAGE_DOCUMENT)
            ));
        }

        if (nextStage === VerificationStageStatus.VERIFICATION_COMPLETE) {
            verification.property.propertyVerificationStatus = PropertyVerificationStatus.VERIFIED;
            await this.propertyRepository.save(verification.property);
        }

        const savedVerification = await this.propertyVerificationRepository.save(verification);

        let subject = `Property Verification Update: ${savedVerification.stage}`;
        let message = `Your property verification stage has advanced to ${savedVerification.stage}.`;

        if (savedVerification.stage === VerificationStageStatus.VERIFICATION_COMPLETE) {
            subject = 'Property Verification Completed Successfully!';
            message = 'Congratulations! Your property verification is officially complete. You can view the reports on your dashboard.';
        }

        const templateAttachments = files?.map(url => {
            const filename = url.split('/').pop() || 'Document';
            return { filename, path: url };
        }) || [];

        await this.emailEvent.sendEmailRequest({
            type: EmailType.VERIFICATION_PIPELINE_UPDATE,
            to: savedVerification.user.email,
            subject,
            context: {
                firstName: savedVerification.user.firstName,
                message,
                comments: comments || '',
                attachments: templateAttachments,
            }
        });

        return this.convertToDto(savedVerification);
    }

    async getAdminVerifications(queryDto: PaginationQueryDto, stage?: VerificationStageStatus, propertyId?: string, userId?: string, search?: string): Promise<PaginationAndSortingResult<PropertyVerificationDto>> {
        const where: any = {};
        if (stage) where.stage = stage;
        if (propertyId) where.property = { id: propertyId };
        if (userId) where.user = { id: userId };

        let customQuery = this.propertyVerificationRepository.createQueryBuilder('pv')
            .leftJoinAndSelect('pv.property', 'property')
            .leftJoinAndSelect('property.location', 'location')
            .leftJoinAndSelect('pv.user', 'user')
            .leftJoinAndSelect('pv.verificationFiles', 'verificationFiles')
            .leftJoinAndSelect('pv.adminStageFiles', 'adminStageFiles')
            .where(where);

        if (search) {
            customQuery = customQuery.andWhere('pv.caseId ILIKE :search', { search: `%${search}%` });
        }

        const page = queryDto.page || 1;
        const limit = Math.min(queryDto.limit || 10, 50);
        const skip = (page - 1) * limit;

        const sortBy = queryDto.sortBy || 'createdAt';
        const order = queryDto.order || 'DESC';

        customQuery = customQuery
            .orderBy(`pv.${sortBy}`, order)
            .skip(skip)
            .take(limit);

        const [items, total] = await customQuery.getManyAndCount();

        return PaginationAndSorting.getPaginateResult(
            items,
            total,
            queryDto,
            (item: PropertyVerification) => this.convertToDto(item)
        );
    }

    private async getVerificationOrThrow(verificationId: string, userId: string): Promise<PropertyVerification> {
        const verification = await this.propertyVerificationRepository.findOne({
            where: { id: verificationId },
            relations: ['property', 'property.company', 'property.location', 'user', 'reviewUser', 'verificationFiles', 'adminStageFiles']
        });

        if (!verification) {
            throw new NotFoundException('Verification request not found');
        }

        const user: User = await this.userService.findById(userId);

        if (verification.user.id !== userId || user.role === UserRole.USER) {
            throw new UnauthorizedException('You do not have permission to access this verification request');
        }

        return verification;
    }

    public convertToDto(verification: PropertyVerification): PropertyVerificationDto {
        return {
            id: verification.id,
            createdAt: verification.createdAt,
            updatedAt: verification.updatedAt,
            stage: verification.stage,
            caseId: verification.caseId,
            adminComments: verification.adminComments,
            reviewedAt: verification.reviewedAt,
            verificationFiles: verification.verificationFiles?.map(file => file.url) || [],
            adminStageFiles: verification.adminStageFiles?.map(file => file.url) || [],
            property: verification.property ? this.propertyService.convertToDto(verification.property) : null,
            user: verification.user ? this.userService.convertToDto(verification.user) : null,
            reviewUser: verification.reviewUser ? this.userService.convertToDto(verification.reviewUser) : null,
        };
    }
}
