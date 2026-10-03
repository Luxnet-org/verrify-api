import { FileAttachmentResponseDto } from '../response/file-attachment-response.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DateDto } from './date.dto';
import { VerificationStageStatus } from '../enum/verification-stage-status.enum';
import { PropertyDto } from './property.dto';
import { UserDto } from './user.dto';
import { StageHistoryEntry } from './stage-history-entry.dto';
import { VerificationPackageDto } from './verification-package.dto';

export class PropertyVerificationDto extends DateDto {
  @ApiProperty()
  stage: VerificationStageStatus;

  @ApiPropertyOptional()
  caseId: string | null;

  @ApiPropertyOptional()
  adminComments: string | null;

  @ApiProperty({ type: 'object', additionalProperties: true, nullable: true })
  additionalInformation: Record<string, unknown> | null;

  @ApiPropertyOptional()
  reviewedAt: Date | null;

  @ApiProperty({ type: [String] })
  verificationFiles: string[];

  @ApiProperty({ type: [FileAttachmentResponseDto] })
  fileAttachments: FileAttachmentResponseDto[];

  @ApiProperty({ type: [String] })
  adminStageFiles: string[];

  @ApiProperty({ type: () => PropertyDto })
  property: PropertyDto | null;

  @ApiProperty({ type: () => UserDto })
  user: UserDto | null;

  @ApiPropertyOptional({ type: () => UserDto })
  reviewUser: UserDto | null;

  @ApiProperty({
    type: [StageHistoryEntry],
    description: 'Ordered array of stage transitions with timestamps',
  })
  stageHistory: StageHistoryEntry[];

  @ApiPropertyOptional({ type: () => VerificationPackageDto })
  verificationPackage: VerificationPackageDto | null;
}
