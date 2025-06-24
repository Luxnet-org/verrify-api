import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { PropertyVerificationStatus } from '../enum/property-verification-status.enum';
import { PropertyType } from '../enum/property-type.enum';
import { PaginationQueryDto } from '../../utility/pagination-and-sorting';
import { Type } from 'class-transformer';

export class PropertySearchQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'This is the field to filter by verification status',
  })
  @IsOptional()
  @IsEnum(PropertyVerificationStatus)
  verificationStatus: PropertyVerificationStatus;

  @ApiPropertyOptional({
    description: 'This is the field to filter by property type',
  })
  @IsOptional()
  @IsEnum(PropertyType)
  propertyType: PropertyType;

  @ApiPropertyOptional()
  @IsOptional()
  isSubProperty: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  isPublic: boolean;
}
