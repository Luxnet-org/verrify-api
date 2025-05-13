import { ApiPropertyOptional } from '@nestjs/swagger';
import { CompanyVerificationStatus } from '../../model/enum/company-verification-status.enum';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateVerificationStatusDto {
  @ApiPropertyOptional()
  @IsEnum(CompanyVerificationStatus)
  @IsOptional()
  verificationStatus: CompanyVerificationStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  verificationMessage: string;
}
