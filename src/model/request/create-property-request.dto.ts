import { PropertyType } from '../enum/property-type.enum';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Polygon } from 'geojson';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Reference to certification of occupancy document',
  })
  certificationOfOccupancy: string;

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

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Reference to letter of intent document',
  })
  letterOfIntent: string;

  @IsBoolean()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Whether the property is being submitted for verification',
    example: false,
  })
  isSubmitted: boolean;
}
