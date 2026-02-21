import { ApiProperty } from '@nestjs/swagger';
import { Geometry } from 'geojson';
import { PropertyType } from '../enum/property-type.enum';
import { UserLookupResponseDto } from './user-lookup-resonse.dto';
import { CompanyLookupResponse } from './company-lookup-response.dto';
import { PropertyVerificationStatus } from '../enum/property-verification-status.enum';

export class PropertyLookupResponseDto {
  @ApiProperty()
  propertyId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  pin: string | null;

  @ApiProperty()
  description: string;

  @ApiProperty()
  propertyVerificationStatus: PropertyVerificationStatus | null;

  @ApiProperty()
  area: number;

  @ApiProperty()
  polygon: Geometry;

  @ApiProperty()
  address: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  state: string;

  @ApiProperty()
  propertyType: PropertyType;

  @ApiProperty()
  isSubProperty: boolean;

  @ApiProperty()
  users: UserLookupResponseDto[] | null;

  @ApiProperty()
  company: CompanyLookupResponse | null;
}
