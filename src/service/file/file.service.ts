import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MyLoggerService } from '../logger/my-logger.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileEntity } from '../../model/entity/file.entity';
import { ConfigInterface } from '../../config-module/configuration';
import { ConfigService } from '@nestjs/config';
import { UploadApiResponse } from 'cloudinary';
import { DateUtility } from '../../utility/date-utility';
import { v4 as uuid } from 'uuid';
import { v2 as CloudinaryAPI } from 'cloudinary';
import { RuntimeException } from '@nestjs/core/errors/exceptions';
import { FileType } from '../../model/enum/file-type.enum';
import { User } from '../../model/entity/user.entity';
import { UploadFileRequestDto } from './file-request.dto';
import { FileResponseDto } from './file-response.dto';

@Injectable()
export class FileService {
  private readonly logger: MyLoggerService = new MyLoggerService();

  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    private readonly configService: ConfigService<ConfigInterface>,
  ) {}

  async uploadFileService(
    fileType: FileType,
    file: Express.Multer.File,
  ): Promise<FileResponseDto> {
    if (!FileType[fileType]) {
      throw new BadRequestException('Invalid file type');
    }

    const uploadedFile: FileEntity = await this.uploadFile(
      file,
      null,
      fileType,
    );

    this.logger.log('File service saved file successfully', FileService.name);
    return {
      fileId: uploadedFile.id,
      url: uploadedFile.url,
    };
  }

  async uploadFile<T>(
    file: Express.Multer.File,
    entity: T,
    fileType: FileType,
  ): Promise<FileEntity> {
    const newFile: FileEntity = await this.uploadFileToCloudinary(file);
    newFile.fileType = fileType;

    switch (fileType) {
      case FileType.PROFILE_PICTURE:
        newFile.user = entity as User;
        break;
      default:
        break;
    }

    this.logger.log('File saved successfully', FileService.name);
    return await this.fileRepository.save(newFile);
  }

  async updateWithUrl<T>(
    url: string,
    entity: T,
    fileType: FileType,
  ): Promise<FileEntity> {
    let findFile: FileEntity | null = await this.fileRepository.findOne({
      where: {
        url,
      },
    });

    if (!findFile) {
      throw new NotFoundException('File not found');
    }

    findFile = await this.updateFile(findFile, entity, fileType);

    this.logger.log('File updated with url successfully', FileService.name);
    return findFile;
  }

  async updateFile<T>(
    fileEntity: FileEntity,
    entity: T,
    fileType: FileType,
  ): Promise<FileEntity> {
    if (fileEntity.fileType !== fileType) {
      throw new BadRequestException('File type do not match');
    }

    if (entity) {
      switch (fileType) {
        case FileType.PROFILE_PICTURE:
          fileEntity.user = entity as unknown as User;
          break;
        default:
          break;
      }
    } else {
      fileEntity.user = null;
    }

    const updatedFile: FileEntity = await this.fileRepository.save(fileEntity);

    this.logger.log('File updated successfully', FileService.name);
    return updatedFile;
  }

  async uploadFileToCloudinary(file: Express.Multer.File): Promise<FileEntity> {
    const fileName = `${DateUtility.currentDate.toISOString()}_${file.originalname}_${uuid()}`;
    const uploadResult = await new Promise<UploadApiResponse>(
      (resolve, reject) => {
        CloudinaryAPI.uploader
          .upload_stream(
            { public_id: fileName, folder: 'verrify' },
            (error, result) => {
              if (error) {
                return reject(new RuntimeException(error.message));
              }
              if (!result) {
                return reject(
                  new RuntimeException(
                    'Upload failed: No result from Cloudinary',
                  ),
                );
              }
              return resolve(result);
            },
          )
          .end(file.buffer);
      },
    );

    this.logger.log(
      'File uploaded to cloudinary successfully',
      FileService.name,
    );
    return this.fileRepository.create({
      fileName,
      url: uploadResult.secure_url,
    });
  }
}
