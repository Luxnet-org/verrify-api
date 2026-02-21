import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AdminOverridePropertyDto {
    @IsOptional()
    @IsString()
    @ApiPropertyOptional({ description: 'Override the name of the property' })
    name?: string;

    @IsOptional()
    @IsString()
    @ApiPropertyOptional({ description: 'Override the description of the property' })
    description?: string;

    @IsOptional()
    @IsString()
    @ApiPropertyOptional({ description: 'Override the property type' })
    propertyType?: string;

    @IsOptional()
    @IsString()
    @ApiPropertyOptional({ description: 'Override the polygon bounds of the property' })
    polygon?: string;

    @IsOptional()
    @IsString()
    @ApiPropertyOptional({ description: 'Override the address of the property' })
    address?: string;

    @IsOptional()
    @IsString()
    @ApiPropertyOptional({ description: 'Override the city of the property' })
    city?: string;

    @IsOptional()
    @IsString()
    @ApiPropertyOptional({ description: 'Override the state of the property' })
    state?: string;

    @IsOptional()
    @IsString()
    @ApiPropertyOptional({ description: 'Override the country of the property' })
    country?: string;
}
