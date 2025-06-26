import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { CompanyVerificationStatus } from '../enum/company-verification-status.enum';
import { AddressFileTypeEnum } from '../enum/address-file-type.enum';

export class UpdateCompanyProfileDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phoneNumber: string;

  @ApiPropertyOptional()
  @IsEnum(AddressFileTypeEnum)
  @IsOptional()
  proofOfAddressType: AddressFileTypeEnum;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  proofOfAddress: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  profileImage: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  city: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  state: string;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional()
  isSubmitted: boolean;
}
