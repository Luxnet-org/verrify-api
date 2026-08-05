import { AddressFileTypeEnum } from '../enum/address-file-type.enum';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CompanyProfileRequestDto {
  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  description: string;

  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  phoneNumber: string;

  @ApiPropertyOptional()
  @IsEnum(AddressFileTypeEnum)
  @IsNotEmpty()
  @IsOptional()
  proofOfAddressType: AddressFileTypeEnum;

  @ApiPropertyOptional()
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  @IsOptional()
  proofOfAddressFileId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  @IsOptional()
  profileImageId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  address: string;

  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  city: string;

  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  state: string;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional()
  isSubmitted: boolean;
}
