import { PropertyType } from '../enum/property-type.enum';
import {
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    ValidateIf,
} from 'class-validator';
import { Polygon } from 'geojson';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InitiateVerificationDto {
    @IsOptional()
    @IsString()
    @ApiPropertyOptional({ description: 'Existing property ID. If provided, other fields are optional.' })
    propertyId?: string;

    @ValidateIf(o => !o.propertyId)
    @IsString()
    @IsNotEmpty()
    @ApiPropertyOptional({ description: 'Property name (required if propertyId is not provided)' })
    name?: string;

    @ValidateIf(o => !o.propertyId)
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Property description' })
    description?: string;

    @ValidateIf(o => !o.propertyId)
    @IsNotEmpty()
    @ApiPropertyOptional({ description: 'Property polygon boundaries (required if propertyId is not provided)' })
    polygon?: Polygon;

    @ValidateIf(o => !o.propertyId)
    @IsEnum(PropertyType)
    @IsNotEmpty()
    @ApiPropertyOptional({
        description: 'Type of property (required if propertyId is not provided)',
        enum: PropertyType,
        example: PropertyType.LAND,
    })
    propertyType?: PropertyType;

    @ValidateIf(o => !o.propertyId)
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Property address' })
    address?: string;

    @ValidateIf(o => !o.propertyId)
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Property city' })
    city?: string;

    @ValidateIf(o => !o.propertyId)
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Property state' })
    state?: string;

    @ValidateIf(o => !o.propertyId)
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Property country' })
    country?: string;

    // Note: File uploads usually handled separately or via array of URLs.
    // We can include verificationFiles if needed.
    @IsOptional()
    @ApiPropertyOptional({ description: 'Array of file URLs or paths for verification', type: [String] })
    verificationFiles?: string[];
}
