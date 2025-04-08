import { FileType } from 'src/model/enum/file-type.enum';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadFileRequestDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(FileType)
  fileType: FileType;
}
