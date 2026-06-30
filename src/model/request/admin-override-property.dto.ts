import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PropertyType } from '../enum/property-type.enum';

export class AdminOverridePropertyDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Override the name of the property' })
  name?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Override the description of the property',
  })
  description?: string;

  @IsOptional()
  @IsEnum(PropertyType)
  @ApiPropertyOptional({
    description: 'Override the property type',
    enum: PropertyType,
  })
  propertyType?: PropertyType;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Override the polygon bounds of the property',
  })
  polygon?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Override the address of the property' })
  address?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Override the city of the property' })
  city?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Override the state of the property' })
  state?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Override the country of the property' })
  country?: string;
}
