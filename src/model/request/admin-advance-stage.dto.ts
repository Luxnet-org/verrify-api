import { IsOptional, IsString, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AdminAdvanceStageDto {
    @ApiPropertyOptional({ type: [String], description: 'Optional array of report files when completing STAGE_3' })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    verificationFiles?: string[];

    @ApiPropertyOptional({ description: 'Optional comments added by the admin' })
    @IsOptional()
    @IsString()
    adminComments?: string;
}
