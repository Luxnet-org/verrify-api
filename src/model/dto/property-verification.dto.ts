import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DateDto } from '../../utility/date.dto';
import { VerificationStageStatus } from '../enum/verification-stage-status.enum';
import { PropertyDto } from './property.dto';
import { UserDto } from './user.dto';

export class PropertyVerificationDto extends DateDto {
    @ApiProperty()
    stage: VerificationStageStatus;

    @ApiPropertyOptional()
    caseId: string | null;

    @ApiPropertyOptional()
    adminComments: any | null;

    @ApiPropertyOptional()
    reviewedAt: Date | null;

    @ApiProperty({ type: [String] })
    verificationFiles: string[];

    @ApiProperty({ type: [String] })
    adminStageFiles: string[];

    @ApiProperty({ type: () => PropertyDto })
    property: PropertyDto | null;

    @ApiProperty({ type: () => UserDto })
    user: UserDto | null;

    @ApiPropertyOptional({ type: () => UserDto })
    reviewUser: UserDto | null;
}
