import { PropertyType } from '../enum/property-type.enum';
import {
  IsEnum,
  IsOptional,
  IsObject,
  IsString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Polygon } from 'geojson';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { FileAttachmentRequestDto } from './file-attachment-request.dto';

export class UpdatePropertyVerificationDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description:
      'Existing property ID. If provided, other fields are optional.',
  })
  propertyId?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Property name' })
  name?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Property description' })
  description?: string;

  @IsOptional()
  @ApiPropertyOptional({ description: 'Property polygon boundaries' })
  polygon?: Polygon;

  @IsEnum(PropertyType)
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Type of property',
    enum: PropertyType,
    example: PropertyType.LAND,
  })
  propertyType?: PropertyType;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Property address' })
  address?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Property city' })
  city?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Property state' })
  state?: string;

  @IsString()
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
