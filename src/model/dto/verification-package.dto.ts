import { ApiProperty } from '@nestjs/swagger';
import { DateDto } from '../../utility/date.dto';

export class VerificationPackageDto extends DateDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  sortOrder: number;
}
