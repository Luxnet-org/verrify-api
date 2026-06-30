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
  description: string | null;

  @ApiProperty()
  propertyVerificationStatus: PropertyVerificationStatus | null;

  @ApiProperty()
  area: number | null;

  @ApiProperty()
  polygon: Geometry | null;

  @ApiProperty()
  address: string | null;

  @ApiProperty()
  city: string | null;

  @ApiProperty()
  state: string | null;

  @ApiProperty()
  propertyType: PropertyType;

  @ApiProperty()
  isSubProperty: boolean;

  @ApiProperty()
  isPublic: boolean;

  @ApiProperty()
  users: UserLookupResponseDto[] | null;

  @ApiProperty()
  company: CompanyLookupResponse | null;
}
