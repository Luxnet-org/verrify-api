import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Polygon } from 'geojson';
import { PropertyType } from '../enum/property-type.enum';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { OtherDocumentRequestDto } from './create-property-request.dto';

export class UpdatePropertyRequestDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional()
  description: string;

  @IsOptional()
  @ApiPropertyOptional()
  polygon: Polygon;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional()
  address: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional()
  city: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional()
  state: string;

  @IsEnum(PropertyType)
  @IsOptional()
  @ApiPropertyOptional()
  propertyType: PropertyType;

  @IsString()
  @IsUUID()
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional()
  certificationOfOccupancyFileId: string;

  @IsString()
  @IsUUID()
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional()
  contractOfSaleFileId: string;

  @IsString()
  @IsUUID()
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional()
  surveyPlanFileId: string;

  @IsString()
  @IsUUID()
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional()
  letterOfIntentFileId: string;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional()
  isSubmitted: boolean;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({
    description:
      'Controls public visibility. Can only be true after the property has an approved verification baseline.',
  })
  isPublic?: boolean;

  @IsString()
  @IsUUID()
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional()
  deedOfConveyanceFileId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OtherDocumentRequestDto)
  @IsOptional()
  @ApiPropertyOptional({
    type: [OtherDocumentRequestDto],
    description:
      'Other property documents. Omitted leaves unchanged, empty array clears, provided array replaces.',
  })
  otherDocuments?: OtherDocumentRequestDto[];

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayNotEmpty()
  @IsOptional()
  @ApiPropertyOptional({
    type: [String],
    nullable: true,
    description:
      'Sub-property user emails. Omitted or null leaves assignments unchanged; a non-empty array replaces them after verification approval.',
  })
  users?: string[] | null;
}
