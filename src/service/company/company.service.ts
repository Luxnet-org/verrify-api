import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { MyLoggerService } from '../logger/my-logger.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Company } from '../../model/entity/company.entity';
import { Repository } from 'typeorm';
import { CompanyDto } from '../../model/dto/company.dto';
import { UserService } from '../user/user.service';
import { User } from '../../model/entity/user.entity';
import { UserRole } from '../../model/enum/role.enum';
import { CompanyProfileRequestDto } from '../../model/request/create-company-profile.dto';
import { CompanyVerificationStatus } from '../../model/enum/company-verification-status.enum';
import { FileService } from '../file/file.service';
import { FileType } from '../../model/enum/file-type.enum';
import { LocationEntity } from '../../model/entity/location.entity';
import { UpdateCompanyProfileDto } from '../../model/request/update-company-profile.dto';
import {
  PaginationAndSorting,
  PaginationAndSortingResult,
} from '../../utility/pagination-and-sorting';
import { CompanyLookupResponse } from '../../model/response/company-lookup-response.dto';
import { CompanySearchQueryDto } from '../../model/request/company-search-query.dto';
import { UpdateVerificationStatusDto } from '../../model/request/update-verification-status.dto';
import { EmailEvent } from '../email/email-event.service';
import { EmailRequest } from '../../model/request/email-request.dto';
import { EmailType } from '../../model/enum/email-type.enum';
import { VerdictDto } from '../../model/request/verdict.dto';

@Injectable()
export class CompanyService {
  private readonly logger: MyLoggerService = new MyLoggerService(
    CompanyService.name,
  );

  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly userService: UserService,
    private readonly fileService: FileService,
    @InjectRepository(LocationEntity)
    private readonly locationRepository: Repository<LocationEntity>,
    private readonly emailEvent: EmailEvent,
  ) { }

  async findAll(
    searchDto: CompanySearchQueryDto,
  ): Promise<PaginationAndSortingResult<CompanyLookupResponse>> {
    const findOptions = PaginationAndSorting.createFindOptions<Company>(
      'name',
      searchDto,
      {},
      { companyVerificationStatus: searchDto.verificationStatus },
      ['proofOfAddress', 'profileImage'],
    );

    const [companies, count] =
      await this.companyRepository.findAndCount(findOptions);

    return PaginationAndSorting.getPaginateResult(
      companies,
      count,
      searchDto,
      (company: Company): CompanyLookupResponse => {
        return {
          companyId: company.id,
          companyVerificationStatus: company.companyVerificationStatus,
          proofOfAddressType: company.proofOfAddressType,
          profileImage: company.profileImage ? company.profileImage.url : null,
          name: company.name,
        };
      },
    );
  }

  async findUserCompany(userId: string): Promise<CompanyDto> {
    const company: Company | null = await this.companyRepository.findOne({
      where: {
        user: { id: userId },
      },
      relations: ['proofOfAddress', 'profileImage', 'address', 'user'],
    });

    if (!company) {
      throw new BadRequestException('Company profile does not exist');
    }

    this.logger.log(
      `User company profile retrieved ${company.id}`,
      CompanyService.name,
    );
    return this.convertToDto(company);
  }

  async findOne(companyId: string, userId: string): Promise<CompanyDto> {
    const company: Company = await this.findById(companyId, [
      'proofOfAddress',
      'profileImage',
      'address',
      'user',
    ]);

    this.logger.log(
      `Single company profile retrieved ${company.id}`,
      CompanyService.name,
    );
    return this.convertToDto(company);
  }

  async findById(
    companyId: string,
    relations: string[] = [],
  ): Promise<Company> {
    const company: Company | null = await this.companyRepository.findOne({
      where: {
        id: companyId,
      },
      relations,
    });

    if (!company) {
      throw new NotFoundException('Company profile not found');
    }

    return company;
  }

  async findByUserId(
    userId: string,
    relations: string[] = [],
  ): Promise<Company> {
    const company: Company | null = await this.companyRepository.findOne({
      where: {
        user: { id: userId },
      },
      relations,
    });

    if (!company) {
      throw new NotFoundException('Company profile not found');
    }

    return company;
  }

  async create(
    userId: string,
    companyDto: CompanyProfileRequestDto,
  ): Promise<CompanyDto> {
    const user: User | null = await this.userService.findById(userId);

    const findCompany: Company | null = await this.companyRepository.findOne({
      where: {
        user: { id: userId },
      },
    });

    if (findCompany) {
      throw new BadRequestException('Company profile already exist');
    }

    if (companyDto.proofOfAddressType && !companyDto.proofOfAddress) {
      throw new BadRequestException(
        'Provide proofOfAddress file when proofOfAddressType is specified',
      );
    }

    if (companyDto.address && (!companyDto.city || !companyDto.state)) {
      throw new BadRequestException(
        'To add address: city and state must be provided',
      );
    }

    let company: Company = this.companyRepository.create({
      name: companyDto.name,
      description: companyDto.description,
      phoneNumber: companyDto.phoneNumber,
      companyVerificationStatus: CompanyVerificationStatus.NOT_VERIFIED,
      proofOfAddressType: companyDto.proofOfAddressType,
      user,
    });
    company = await this.companyRepository.save(company);

    if (companyDto.address) {
      const location: LocationEntity = this.locationRepository.create({
        address: companyDto.address,
        state: companyDto.state,
        city: companyDto.city,
        company,
      });
      await this.locationRepository.save(location);
      company.address = location;
    }

    if (companyDto.proofOfAddress) {
      company.proofOfAddress = await this.fileService.updateWithUrl(
        companyDto.proofOfAddress,
        company,
        FileType.PROOF_OF_ADDRESS,
      );
    }

    if (companyDto.profileImage) {
      company.profileImage = await this.fileService.updateWithUrl(
        companyDto.profileImage,
        company,
        FileType.COMPANY_PROFILE_PICTURE,
      );
    }

    this.logger.log(
      `Company profile created for user ${user.id}`,
      CompanyService.name,
    );
    return this.convertToDto(company);
  }

  async update(
    companyId: string,
    userId: string,
    companyDto: UpdateCompanyProfileDto,
  ): Promise<CompanyDto> {
    const {
      phoneNumber,
      proofOfAddressType,
      proofOfAddress,
      profileImage,
      address,
      city,
      state,
      name,
      description,
    }: UpdateCompanyProfileDto = companyDto;

    let company: Company = await this.findById(companyId, [
      'proofOfAddress',
      'profileImage',
      'address',
      'user',
    ]);

    const user: User = await this.userService.findById(userId);

    if (company.user.id !== user.id && user.role !== UserRole.ADMIN) {
      throw new UnauthorizedException(
        'Access denied to modify company profile',
      );
    }

    if (description) {
      company.description = description;
    }

    if (profileImage) {
      if (company.profileImage) {
        await this.fileService.updateFile(
          company.profileImage,
          null,
          FileType.COMPANY_PROFILE_PICTURE,
        );
      }
      user.profileImage = await this.fileService.updateWithUrl(
        profileImage,
        company,
        FileType.COMPANY_PROFILE_PICTURE,
      );
    }

    if (proofOfAddress || address || name) {
      if (
        company.user.id === user.id &&
        user.role !== UserRole.ADMIN &&
        (company.companyVerificationStatus ===
          CompanyVerificationStatus.PENDING ||
          company.companyVerificationStatus ===
          CompanyVerificationStatus.VERIFIED)
      ) {
        throw new BadRequestException(
          'Cannot modify company profile during review',
        );
      }

      if (name) {
        company.name = name;
      }

      if (phoneNumber) {
        company.phoneNumber = phoneNumber;
      }

      if (address) {
        if (!city || !state) {
          throw new BadRequestException(
            'To modify address: city and state must be provided',
          );
        }

        company.address.address = address;
        company.address.city = city;
        company.address.state = state;
      }

      if (proofOfAddress) {
        if (!proofOfAddressType) {
          throw new BadRequestException(
            'To modify proofOfAddress file: set proofOfAddressType',
          );
        }

        company.proofOfAddressType = proofOfAddressType;

        if (company.proofOfAddress) {
          await this.fileService.updateFile(
            company.proofOfAddress,
            null,
            FileType.PROOF_OF_ADDRESS,
          );
        }

        company.proofOfAddress = await this.fileService.updateWithUrl(
          proofOfAddress,
          company,
          FileType.PROOF_OF_ADDRESS,
        );
      }
    }

    company = await this.companyRepository.save(company);

    this.logger.log(
      `Company profile ${company.id} was modified`,
      CompanyService.name,
    );
    return this.convertToDto(company);
  }

  async submitForVerification(
    companyId: string,
    userId: string,
  ): Promise<string> {
    const company = await this.findById(companyId, ['user']);

    if (company.user.id !== userId) {
      throw new UnauthorizedException(
        'Only the company owner can submit for verification',
      );
    }

    if (
      company.companyVerificationStatus !==
      CompanyVerificationStatus.NOT_VERIFIED &&
      company.companyVerificationStatus !==
      CompanyVerificationStatus.REJECTED
    ) {
      throw new BadRequestException(
        `Cannot submit company with status ${company.companyVerificationStatus}. Only NOT_VERIFIED or REJECTED companies can be submitted.`,
      );
    }

    company.companyVerificationStatus = CompanyVerificationStatus.PENDING;
    company.reviewUser = null as any;
    company.reviewedAt = null as any;
    company.verifiedAt = null as any;
    company.verificationMessage = null as any;

    await this.companyRepository.save(company);

    // Send submission email
    const emailRequest: EmailRequest = {
      type: EmailType.COMPANY_SUBMITTED,
      to: company.user.email,
      context: {
        userName: company.user.firstName,
        companyName: company.name,
      },
    };
    await this.emailEvent.sendEmailRequest(emailRequest);

    this.logger.log(
      `Company ${company.id} submitted for verification by user ${userId}`,
    );
    return `Company ${company.id} has been submitted for verification`;
  }

  async assignReview(
    companyId: string,
    adminUserId: string,
  ): Promise<string> {
    const admin: User = await this.userService.findById(adminUserId);

    if (admin.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('Only admins can assign reviews');
    }

    const company = await this.findById(companyId, ['user']);

    if (
      company.companyVerificationStatus !==
      CompanyVerificationStatus.PENDING
    ) {
      throw new BadRequestException(
        `Cannot assign review for company with status ${company.companyVerificationStatus}. Only PENDING companies can be assigned for review.`,
      );
    }

    company.companyVerificationStatus = CompanyVerificationStatus.IN_REVIEW;
    company.reviewUser = admin;
    company.reviewedAt = new Date();

    await this.companyRepository.save(company);

    this.logger.log(
      `Company ${company.id} assigned for review to admin ${adminUserId}`,
    );
    return `Company ${company.id} is now in review by admin ${admin.firstName}`;
  }

  async giveVerdict(
    companyId: string,
    adminUserId: string,
    verdictDto: VerdictDto,
  ): Promise<string> {
    const company = await this.findById(companyId, ['user', 'reviewUser']);

    if (
      company.companyVerificationStatus !==
      CompanyVerificationStatus.IN_REVIEW
    ) {
      throw new BadRequestException(
        `Cannot give verdict for company with status ${company.companyVerificationStatus}. Only IN_REVIEW companies can receive a verdict.`,
      );
    }

    if (!company.reviewUser || company.reviewUser.id !== adminUserId) {
      throw new UnauthorizedException(
        'Only the assigned reviewer can give a verdict on this company',
      );
    }

    const newStatus =
      verdictDto.verdict === 'VERIFIED'
        ? CompanyVerificationStatus.VERIFIED
        : CompanyVerificationStatus.REJECTED;

    company.companyVerificationStatus = newStatus;
    company.verificationMessage = verdictDto.verificationMessage;
    company.verifiedAt = new Date();

    await this.companyRepository.save(company);

    // Send verdict email
    const emailRequest: EmailRequest = {
      type:
        newStatus === CompanyVerificationStatus.VERIFIED
          ? EmailType.COMPANY_VERIFIED
          : EmailType.COMPANY_REJECTED,
      to: company.user.email,
      context: {
        userName: company.user.firstName,
        companyName: company.name,
        companyDescription: company.description || '',
        rejectionMessage: verdictDto.verificationMessage,
      },
    };
    await this.emailEvent.sendEmailRequest(emailRequest);

    this.logger.log(
      `Company ${company.id} verdict: ${newStatus} by admin ${adminUserId}`,
    );
    return `Company ${company.id} has been ${newStatus.toLowerCase()}`;
  }

  convertToDto(company: Company): CompanyDto {
    return {
      id: company.id,
      name: company.name,
      description: company.description,
      verificationMessage: company.verificationMessage,
      phoneNumber: company.phoneNumber,
      companyVerificationStatus: company.companyVerificationStatus,
      proofOfAddressType: company.proofOfAddressType,
      proofOfAddress: company.proofOfAddress
        ? company.proofOfAddress.url
        : null,
      profileImage: company.profileImage ? company.profileImage.url : null,
      address: company.address ? company.address.address : null,
      city: company.address ? company.address.city : null,
      state: company.address ? company.address.state : null,
    };
  }
}
