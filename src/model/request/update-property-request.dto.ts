import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Polygon } from 'geojson';
import { PropertyType } from '../enum/property-type.enum';
import { ApiPropertyOptional } from '@nestjs/swagger';

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

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional()
  deedOfConveyance: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayNotEmpty()
  @IsOptional()
  users: string[];
}
