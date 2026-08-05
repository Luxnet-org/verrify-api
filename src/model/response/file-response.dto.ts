import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FileResponseDto {
  @ApiProperty()
  fileId: string;

  @ApiProperty()
  url: string;

  @ApiPropertyOptional({
    description: 'Expiry for private presigned URLs; omitted for public files',
    nullable: true,
  })
  expiresAt?: Date | null;
}
