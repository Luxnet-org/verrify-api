import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FileAttachmentRequestDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Custom label for the document' })
  label: string;

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  @ApiProperty({ description: 'Uploaded file ID' })
  fileId: string;
}
