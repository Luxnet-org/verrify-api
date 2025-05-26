import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { PropertyType } from '../enum/property-type.enum';
import { PropertyVerificationStatus } from '../enum/property-verification-status.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LocationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  limit?: number = 1000;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(PropertyType)
  propertyType?: PropertyType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(PropertyVerificationStatus)
  status?: PropertyVerificationStatus;
}

export class ViewportQueryDto extends LocationQueryDto {
  @ApiProperty()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  north: number;

  @ApiProperty()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  south: number;

  @ApiProperty()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  east: number;

  @ApiProperty()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  west: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  zoom?: number;
}

export class NearbyQueryDto extends LocationQueryDto {
  @ApiProperty()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  latitude: number;

  @ApiProperty()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  longitude: number;

  @ApiProperty()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  radiusKm: number;
}
