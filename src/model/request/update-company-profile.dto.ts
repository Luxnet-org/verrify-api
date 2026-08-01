import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
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
  @IsUUID()
  @IsOptional()
  proofOfAddressFileId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsUUID()
  @IsOptional()
  profileImageId: string;

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
