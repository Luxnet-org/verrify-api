import { ApiProperty } from '@nestjs/swagger';
import { VerificationStageStatus } from '../enum/verification-stage-status.enum';

export class StageHistoryEntry {
    @ApiProperty({ enum: VerificationStageStatus, description: 'The verification stage' })
    stage: VerificationStageStatus;

    @ApiProperty({ type: Date, description: 'Timestamp when this stage was reached' })
    completedAt: Date;
}
