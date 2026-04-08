import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateVerificationPackageDto {
    @ApiPropertyOptional({ example: 'Basic Verification' })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiPropertyOptional({ example: 'Survey inspection and title document verification.' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ example: 150000 })
    @IsNumber()
    @Min(0)
    @IsOptional()
    price?: number;

    @ApiPropertyOptional({ example: true })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @ApiPropertyOptional({ example: 0 })
    @IsNumber()
    @IsOptional()
    sortOrder?: number;
}
