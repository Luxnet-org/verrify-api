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
      companyVerificationStatus: companyDto.isSubmitted
        ? CompanyVerificationStatus.PENDING
        : CompanyVerificationStatus.NOT_VERIFIED,
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
      isSubmitted,
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

    if (isSubmitted) {
      company.companyVerificationStatus = CompanyVerificationStatus.PENDING;
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

  async updateVerificationStatus(
    companyId: string,
    userId: string,
    verificationStatusDto: UpdateVerificationStatusDto,
  ): Promise<string> {
    const {
      verificationStatus,
      verificationMessage,
    }: UpdateVerificationStatusDto = verificationStatusDto;

    const company = await this.findById(companyId, [
      'proofOfAddress',
      'profileImage',
      'address',
      'user',
    ]);

    if (!verificationStatus || !verificationMessage) {
      throw new BadRequestException(
        'Provide verification status and verification message',
      );
    }

    company.companyVerificationStatus = verificationStatus;
    company.verificationMessage = verificationMessage;
    await this.companyRepository.save(company);

    this.logger.log(
      `Updated company verification status for comapany profile: ${company.id}`,
    );
    return `Verification status of company profile: ${company.id} has been updated to ${verificationStatus}`;
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
