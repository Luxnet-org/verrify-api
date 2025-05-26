import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Polygon } from 'geojson';
import { PropertyType } from '../enum/property-type.enum';

export class CreateSubPropertyRequestDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Property name' })
  name: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayNotEmpty()
  @ApiProperty({ description: 'List of user emails' })
  users: string[];

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
  @ApiPropertyOptional({
    description: 'Reference to certification of occupancy document',
  })
  deedOfConveyance: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Reference to contract of sale document',
  })
  contractOfSale: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Reference to survey plan document' })
  surveyPlan: string;

  @IsBoolean()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Whether the property is being submitted for verification',
    example: false,
  })
  isSubmitted: boolean;
}
