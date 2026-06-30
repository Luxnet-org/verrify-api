import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { MyLoggerService } from '../logger/my-logger.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Company } from '../../model/entity/company.entity';
import { DataSource, Repository } from 'typeorm';
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
import { EmailEvent } from '../email/email-event.service';
import { EmailRequest } from '../../model/request/email-request.dto';
import { EmailType } from '../../model/enum/email-type.enum';
import { VerdictDto, VerdictType } from '../../model/request/verdict.dto';
import { ConfigService } from '@nestjs/config';
import { ConfigInterface } from '../../config-module/configuration';

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
    private readonly emailEvent: EmailEvent,
    private readonly configService: ConfigService<ConfigInterface>,
    private readonly dataSource: DataSource,
  ) {}

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

  async findOne(companyId: string): Promise<CompanyDto> {
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
    const result = await this.dataSource.transaction(async (manager) => {
      const userRepository = manager.getRepository(User);
      const companyRepository = manager.getRepository(Company);
      const locationRepository = manager.getRepository(LocationEntity);

      const user: User | null = await userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(`User with id ${userId} not found`);
      }

      const findCompany: Company | null = await companyRepository.findOne({
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

      let company: Company = companyRepository.create({
        name: companyDto.name,
        description: companyDto.description,
        phoneNumber: companyDto.phoneNumber,
        companyVerificationStatus: CompanyVerificationStatus.NOT_VERIFIED,
        proofOfAddressType: companyDto.proofOfAddressType,
        user,
      });
      company = await companyRepository.save(company);

      if (companyDto.address) {
        const location: LocationEntity = locationRepository.create({
          address: companyDto.address,
          state: companyDto.state,
          city: companyDto.city,
          company,
        });
        await locationRepository.save(location);
        company.address = location;
      }

      if (companyDto.proofOfAddress) {
        company.proofOfAddress = await this.fileService.updateWithUrl(
          companyDto.proofOfAddress,
          company,
          FileType.PROOF_OF_ADDRESS,
          manager,
        );
      }

      if (companyDto.profileImage) {
        company.profileImage = await this.fileService.updateWithUrl(
          companyDto.profileImage,
          company,
          FileType.COMPANY_PROFILE_PICTURE,
          manager,
        );
      }

      return {
        dto: this.convertToDto(company),
        userId: user.id,
      };
    });

    this.logger.log(
      `Company profile created for user ${result.userId}`,
      CompanyService.name,
    );
    return result.dto;
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

    const result = await this.dataSource.transaction(async (manager) => {
      const userRepository = manager.getRepository(User);
      const companyRepository = manager.getRepository(Company);

      let company: Company | null = await companyRepository.findOne({
        where: { id: companyId },
        relations: ['proofOfAddress', 'profileImage', 'address', 'user'],
      });

      if (!company) {
        throw new NotFoundException('Company profile not found');
      }

      const user: User | null = await userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(`User with id ${userId} not found`);
      }

      if (
        company.user.id !== user.id &&
        user.role !== UserRole.ADMIN &&
        user.role !== UserRole.SUPER_ADMIN
      ) {
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
            manager,
          );
        }
        company.profileImage = await this.fileService.updateWithUrl(
          profileImage,
          company,
          FileType.COMPANY_PROFILE_PICTURE,
          manager,
        );
      }

      if (proofOfAddress || address || name) {
        if (
          company.user.id === user.id &&
          user.role !== UserRole.ADMIN &&
          user.role !== UserRole.SUPER_ADMIN &&
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
              manager,
            );
          }

          company.proofOfAddress = await this.fileService.updateWithUrl(
            proofOfAddress,
            company,
            FileType.PROOF_OF_ADDRESS,
            manager,
          );
        }
      }

      company = await companyRepository.save(company);

      return {
        companyId: company.id,
        dto: this.convertToDto(company),
      };
    });

    this.logger.log(
      `Company profile ${result.companyId} was modified`,
      CompanyService.name,
    );
    return result.dto;
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
      company.companyVerificationStatus !== CompanyVerificationStatus.REJECTED
    ) {
      throw new BadRequestException(
        `Cannot submit company with status ${company.companyVerificationStatus}. Only NOT_VERIFIED or REJECTED companies can be submitted.`,
      );
    }

    company.companyVerificationStatus = CompanyVerificationStatus.PENDING;
    company.reviewUser = null;
    company.reviewedAt = null;
    company.verifiedAt = null;
    company.verificationMessage = null;

    await this.companyRepository.save(company);

    // Send submission email
    const emailRequest: EmailRequest = {
      type: EmailType.COMPANY_SUBMITTED,
      to: company.user.email,
      context: {
        name: company.user.firstName,
        companyName: company.name,
      },
    };
    await this.emailEvent.sendEmailRequest(emailRequest);

    this.logger.log(
      `Company ${company.id} submitted for verification by user ${userId}`,
    );
    return `Company ${company.id} has been submitted for verification`;
  }

  async assignReview(companyId: string, adminUserId: string): Promise<string> {
    const admin: User = await this.userService.findById(adminUserId);

    if (admin.role !== UserRole.ADMIN && admin.role !== UserRole.SUPER_ADMIN) {
      throw new UnauthorizedException('Only admins can assign reviews');
    }

    const company = await this.findById(companyId, ['user']);

    if (
      company.companyVerificationStatus !== CompanyVerificationStatus.PENDING
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
      company.companyVerificationStatus !== CompanyVerificationStatus.IN_REVIEW
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
      verdictDto.verdict === VerdictType.VERIFIED
        ? CompanyVerificationStatus.VERIFIED
        : CompanyVerificationStatus.REJECTED;

    company.companyVerificationStatus = newStatus;
    company.verificationMessage = verdictDto.verificationMessage;
    company.verifiedAt = new Date();

    await this.companyRepository.save(company);

    // Send verdict email
    const frontendUrl =
      this.configService.get('app.frontendHost', { infer: true }) ||
      'https://verrify.net';
    const emailRequest: EmailRequest = {
      type:
        newStatus === CompanyVerificationStatus.VERIFIED
          ? EmailType.COMPANY_VERIFIED
          : EmailType.COMPANY_REJECTED,
      to: company.user.email,
      context: {
        name: company.user.firstName,
        companyName: company.name,
        rejectionReason: verdictDto.verificationMessage,
        dashboardLink: `${frontendUrl}/user/dashboard/company`,
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
