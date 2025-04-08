import { ApiProperty } from '@nestjs/swagger';

export class FileResponseDto {
  @ApiProperty()
  fileId: string;

  @ApiProperty()
  url: string;
}
