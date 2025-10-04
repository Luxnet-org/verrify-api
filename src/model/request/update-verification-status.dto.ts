import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CompanyVerificationStatus } from '../enum/company-verification-status.enum';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateVerificationStatusDto {
  @ApiProperty()
  @IsEnum(CompanyVerificationStatus)
  verificationStatus: CompanyVerificationStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  verificationMessage?: string;
}
