import { PropertyType } from '../enum/property-type.enum';
import { PropertyVerificationStatus } from '../enum/property-verification-status.enum';
import { Geometry } from 'geojson';
import { DateDto } from '../../utility/date.dto';
import { UserLookupResponseDto } from '../response/user-lookup-resonse.dto';
import { ApiProperty } from '@nestjs/swagger';

export class PropertyOtherDocumentDto {
  @ApiProperty()
  label: string;

  @ApiProperty()
  url: string;
}

export class PropertyDto extends DateDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  pin: string | null;

  @ApiProperty()
  description: string | null;

  @ApiProperty()
  propertyVerificationStatus: PropertyVerificationStatus;

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
  certificationOfOccupancy: string | null;

  @ApiProperty()
  contractOfSale: string | null;

  @ApiProperty()
  surveyPlan: string | null;

  @ApiProperty()
  letterOfIntent: string | null;

  @ApiProperty()
  deedOfConveyance: string | null;

  @ApiProperty({ type: [PropertyOtherDocumentDto] })
  otherDocuments: PropertyOtherDocumentDto[] | null;

  @ApiProperty()
  isSubProperty: boolean;

  @ApiProperty()
  users: UserLookupResponseDto[] | null;

  @ApiProperty({
    type: [UserLookupResponseDto],
    nullable: true,
    description:
      'Proposed sub-property assignments awaiting verification. Returned to admins on property details.',
  })
  proposedUsers: UserLookupResponseDto[] | null;
}

export class PropertyVersionDto extends DateDto {
  @ApiProperty()
  status: PropertyVerificationStatus;

  @ApiProperty()
  propertyType: PropertyType;

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
  certificationOfOccupancy: string | null;

  @ApiProperty()
  contractOfSale: string | null;

  @ApiProperty()
  surveyPlan: string | null;

  @ApiProperty()
  letterOfIntent: string | null;

  @ApiProperty()
  deedOfConveyance: string | null;

  @ApiProperty({ type: [PropertyOtherDocumentDto] })
  otherDocuments: PropertyOtherDocumentDto[] | null;

  @ApiProperty()
  users: UserLookupResponseDto[] | null;

  @ApiProperty()
  adminComments: string | null;

  @ApiProperty()
  statusHistory: { status: PropertyVerificationStatus; changedAt: Date }[];
}

export class AdminPropertyDetailsDto {
  @ApiProperty({ type: PropertyDto })
  current: PropertyDto;

  @ApiProperty({ type: PropertyVersionDto, nullable: true })
  pendingVersion: PropertyVersionDto | null;
}
