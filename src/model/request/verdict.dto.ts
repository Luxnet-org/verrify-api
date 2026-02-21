import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export enum VerdictType {
    VERIFIED = 'VERIFIED',
    REJECTED = 'REJECTED',
}

export class VerdictDto {
    @ApiProperty({ enum: VerdictType })
    @IsEnum(VerdictType)
    @IsNotEmpty()
    verdict: VerdictType;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    verificationMessage: string;
}
