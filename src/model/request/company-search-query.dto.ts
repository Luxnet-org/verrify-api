import { PaginationQueryDto } from '../../utility/pagination-and-sorting';
import { CompanyVerificationStatus } from '../enum/company-verification-status.enum';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export class CompanySearchQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'This is the field to filter by verification status',
  })
  @IsOptional()
  @IsEnum(CompanyVerificationStatus)
  verificationStatus: CompanyVerificationStatus;
}
