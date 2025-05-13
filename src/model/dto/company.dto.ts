import { DateDto } from '../../utility/date.dto';
import { CompanyVerificationStatus } from '../enum/company-verification-status.enum';
import { AddressFileTypeEnum } from '../enum/address-file-type.enum';
import { ApiProperty } from '@nestjs/swagger';

export class CompanyDto extends DateDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  verificationMessage: string;

  @ApiProperty()
  phoneNumber: string | null;

  @ApiProperty()
  companyVerificationStatus: CompanyVerificationStatus;

  @ApiProperty()
  proofOfAddressType: AddressFileTypeEnum | null;

  @ApiProperty()
  proofOfAddress: string | null;

  @ApiProperty()
  profileImage: string | null;

  @ApiProperty()
  address: string | null;

  @ApiProperty()
  city: string | null;

  @ApiProperty()
  state: string | null;
}
