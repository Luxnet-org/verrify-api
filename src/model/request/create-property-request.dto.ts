import { PropertyType } from '../enum/property-type.enum';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Polygon } from 'geojson';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { FileAttachmentRequestDto } from './file-attachment-request.dto';

export class CreatePropertyRequestDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Property name' })
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Property description' })
  description: string;

  @IsNotEmpty()
  @ApiProperty({ description: 'Property polygon boundaries' })
  polygon: Polygon;

  @IsEnum(PropertyType)
  @IsNotEmpty()
  @ApiProperty({
    description: 'Type of property',
    enum: PropertyType,
    example: PropertyType.LAND,
  })
  propertyType: PropertyType;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Property address' })
  address: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Property city' })
  city: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Property state' })
  state: string;

  @IsString()
  @IsUUID()
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Reference to certification of occupancy document',
  })
  certificationOfOccupancyFileId: string;

  @IsString()
  @IsUUID()
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Reference to contract of sale document',
  })
  contractOfSaleFileId: string;

  @IsString()
  @IsUUID()
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Reference to survey plan document' })
  surveyPlanFileId: string;

  @IsString()
  @IsUUID()
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Reference to letter of intent document',
  })
  letterOfIntentFileId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileAttachmentRequestDto)
  @IsOptional()
  @ApiPropertyOptional({
    type: [FileAttachmentRequestDto],
    description: 'Other property documents with custom labels',
  })
  otherDocuments?: FileAttachmentRequestDto[];

  @IsBoolean()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Whether the property is being submitted for verification',
    example: false,
  })
  isSubmitted: boolean;
}
