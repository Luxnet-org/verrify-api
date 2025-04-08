import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  ParseFilePipeBuilder,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileService } from '../service/file/file.service';
import { memoryStorage } from 'multer';
import { FileResponseDto } from '../service/file/file-response.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiResponse } from '../utility/api-response';
import { SwaggerApiResponseData } from '../common/decorator/swagger.decorator';
import { FileType } from '../model/enum/file-type.enum';

@ApiTags('FileUpload API')
@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @ApiOperation({ summary: 'Api to upload a single file' })
  @SwaggerApiResponseData({
    dataClass: FileResponseDto,
    status: HttpStatus.CREATED,
    description: 'File Uploaded successfully.',
  })
  @Post('/upload')
  @ApiConsumes('multipart/form-data')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async upload(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType:
            /^image\/(jpeg|png|gif|bmp|webp|svg\+xml)$|^application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document|vnd\.ms-excel|vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|vnd\.ms-powerpoint|vnd\.openxmlformats-officedocument\.presentationml\.presentation|octet-stream|vnd\.ms-office)$|^text\/plain$|^video\/(mp4|webm|quicktime|x-msvideo|x-matroska)$/,
        })
        .addMaxSizeValidator({ maxSize: 1024 * 1024 * 10 })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: Express.Multer.File,
    @Body('fileInfo') fileType: FileType,
  ): Promise<ApiResponse<FileResponseDto>> {
    const response: FileResponseDto = await this.fileService.uploadFileService(
      fileType,
      file,
    );
    return ApiResponse.success(response, HttpStatus.CREATED);
  }
}
