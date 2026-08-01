import { IsOptional, IsString, IsArray, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AdminAdvanceStageDto {
  @ApiPropertyOptional({
    type: [String],
    description: 'Optional array of report files when completing STAGE_3',
  })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  verificationFileIds?: string[];

  @ApiPropertyOptional({ description: 'Optional comments added by the admin' })
  @IsOptional()
  @IsString()
  adminComments?: string;
}
