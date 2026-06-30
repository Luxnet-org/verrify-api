import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
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
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional()
  certificationOfOccupancy: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional()
  contractOfSale: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional()
  surveyPlan: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional()
  letterOfIntent: string;

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
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional()
  deedOfConveyance: string;

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
