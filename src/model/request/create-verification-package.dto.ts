import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateVerificationPackageDto {
    @ApiProperty({ example: 'Basic Verification' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'Survey inspection and title document verification.' })
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiProperty({ example: 150000 })
    @IsNumber()
    @Min(0)
    price: number;

    @ApiPropertyOptional({ example: true })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @ApiPropertyOptional({ example: 0 })
    @IsNumber()
    @IsOptional()
    sortOrder?: number;
}
