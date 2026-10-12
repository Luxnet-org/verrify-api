import { ApiProperty } from '@nestjs/swagger';

export class FileAttachmentResponseDto {
  @ApiProperty()
  fileId: string;

  @ApiProperty({ type: String, nullable: true })
  label: string | null;

  @ApiProperty()
  url: string;
}
