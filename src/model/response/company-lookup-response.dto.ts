import { ApiProperty } from '@nestjs/swagger';
import { CompanyVerificationStatus } from '../enum/company-verification-status.enum';
import { AddressFileTypeEnum } from '../enum/address-file-type.enum';

export class CompanyLookupResponse {
  @ApiProperty()
  companyId: string;

  @ApiProperty()
  companyVerificationStatus: CompanyVerificationStatus;

  @ApiProperty()
  proofOfAddressType: AddressFileTypeEnum;

  @ApiProperty()
  profileImage: string | null;

  @ApiProperty()
  name: string;
}
