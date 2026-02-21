import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum PropertyVerificationVerdict {
    ACCEPTED = 'ACCEPTED',
    REJECTED = 'REJECTED',
}

export class PropertyVerificationVerdictDto {
    @ApiProperty({ enum: PropertyVerificationVerdict })
    @IsEnum(PropertyVerificationVerdict)
    @IsNotEmpty()
    verdict: PropertyVerificationVerdict;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    comments?: string;
}
