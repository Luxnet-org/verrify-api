import { PropertyVerificationStatus } from '../enum/property-verification-status.enum';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePropertyStatusDto {
  @IsEnum(PropertyVerificationStatus)
  @IsNotEmpty()
  @ApiProperty()
  propertyVerificationStatus: PropertyVerificationStatus;

  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional()
  verificationMessage: string;
}
