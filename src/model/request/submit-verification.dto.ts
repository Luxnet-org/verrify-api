import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SubmitVerificationDto {
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    verificationMessage?: string;
}
