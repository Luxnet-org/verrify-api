import { PropertyType } from '../enum/property-type.enum';
import {
    IsEnum,
    IsOptional,
    IsString,
    IsArray,
} from 'class-validator';
import { Polygon } from 'geojson';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePropertyVerificationDto {
    @IsOptional()
    @IsString()
    @ApiPropertyOptional({ description: 'Existing property ID. If provided, other fields are optional.' })
    propertyId?: string;

    @IsString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Property name' })
    name?: string;

    @IsString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Property description' })
    description?: string;

    @IsOptional()
    @ApiPropertyOptional({ description: 'Property polygon boundaries' })
    polygon?: Polygon;

    @IsEnum(PropertyType)
    @IsOptional()
    @ApiPropertyOptional({
        description: 'Type of property',
        enum: PropertyType,
        example: PropertyType.LAND,
    })
    propertyType?: PropertyType;

    @IsString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Property address' })
    address?: string;

    @IsString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Property city' })
    city?: string;

    @IsString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Property state' })
    state?: string;

    @IsString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Property country' })
    country?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @ApiPropertyOptional({ type: [String], description: 'Optional array of file URLs submitted by the user' })
    verificationFiles?: string[];
}
