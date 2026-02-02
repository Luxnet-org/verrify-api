import { PropertyType } from '../enum/property-type.enum';
import { PropertyVerificationStatus } from '../enum/property-verification-status.enum';
import { Geometry } from 'geojson';
import { DateDto } from '../../utility/date.dto';
import { UserDto } from './user.dto';
import { UserLookupResponseDto } from '../response/user-lookup-resonse.dto';
import { ApiProperty } from '@nestjs/swagger';

export class PropertyDto extends DateDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  propertyVerificationStatus: PropertyVerificationStatus;

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
  certificationOfOccupancy: string | null;

  @ApiProperty()
  contractOfSale: string | null;

  @ApiProperty()
  surveyPlan: string | null;

  @ApiProperty()
  letterOfIntent: string | null;

  @ApiProperty()
  deedOfConveyance: string | null;

  @ApiProperty()
  isSubProperty: boolean;

  @ApiProperty()
  users: UserLookupResponseDto[] | null;
}
