import { PropertyType } from '../enum/property-type.enum';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsString,
  IsArray,
  ValidateNested,
  ValidateIf,
} from 'class-validator';
import { Polygon } from 'geojson';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { FileAttachmentRequestDto } from './file-attachment-request.dto';

export class InitiateVerificationDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description:
      'Existing property ID. If provided, other fields are optional.',
  })
  propertyId?: string;

  @ValidateIf((value: InitiateVerificationDto) => !value.propertyId)
  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional({
    description: 'Property name (required if propertyId is not provided)',
  })
  name?: string;

  @ValidateIf((value: InitiateVerificationDto) => !value.propertyId)
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Property description' })
  description?: string;

  @ValidateIf((value: InitiateVerificationDto) => !value.propertyId)
  @IsNotEmpty()
  @ApiPropertyOptional({
    description:
      'Property polygon boundaries (required if propertyId is not provided)',
  })
  polygon?: Polygon;

  @ValidateIf((value: InitiateVerificationDto) => !value.propertyId)
  @IsEnum(PropertyType)
  @IsNotEmpty()
  @ApiPropertyOptional({
    description: 'Type of property (required if propertyId is not provided)',
    enum: PropertyType,
    example: PropertyType.LAND,
  })
  propertyType?: PropertyType;

  @ValidateIf((value: InitiateVerificationDto) => !value.propertyId)
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Property address' })
  address?: string;

  @ValidateIf((value: InitiateVerificationDto) => !value.propertyId)
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Property city' })
  city?: string;

  @ValidateIf((value: InitiateVerificationDto) => !value.propertyId)
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Property state' })
  state?: string;

  @ValidateIf((value: InitiateVerificationDto) => !value.propertyId)
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Property country' })
  country?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileAttachmentRequestDto)
  @ApiPropertyOptional({
    description: 'Uploaded verification files with document labels',
    type: [FileAttachmentRequestDto],
  })
  fileAttachments?: FileAttachmentRequestDto[];

  @IsOptional()
  @IsObject()
  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    nullable: true,
    description:
      'Dynamic verification information. Replaces the existing object when supplied; null clears it.',
  })
  additionalInformation?: Record<string, unknown> | null;
}
