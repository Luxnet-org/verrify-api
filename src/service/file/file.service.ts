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
import { FileResponseDto } from '../../model/response/file-response.dto';
import { Company } from '../../model/entity/company.entity';
import { Property } from '../../model/entity/property.entity';
import { Article } from '../../model/entity/article.entity';
import { PropertyVerification } from '../../model/entity/property-verification.entity';

@Injectable()
export class FileService {
  private readonly logger: MyLoggerService = new MyLoggerService();

  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    private readonly configService: ConfigService<ConfigInterface>,
  ) { }

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
      relations: [
        'user',
        'companyAddressFile',
        'companyProfileImage',
        'certificationOfOccupancy',
        'contractOfSale',
        'surveyPlan',
        'letterOfIntent',
        'deedOfConveyance',
        'articleTitleImage',
        'propertyVerification',
        'adminPropertyVerification',
      ],
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
          if (fileEntity.user) {
            throw new BadRequestException(
              'File is already associated with user',
            );
          }

          fileEntity.user = entity as unknown as User;
          break;
        case FileType.PROOF_OF_ADDRESS:
          if (fileEntity.companyAddressFile) {
            throw new BadRequestException(
              'File is already associated with company address file',
            );
          }

          fileEntity.companyAddressFile = entity as unknown as Company;
          break;
        case FileType.COMPANY_PROFILE_PICTURE:
          if (fileEntity.companyProfileImage) {
            throw new BadRequestException(
              'File is already associated with company profile image',
            );
          }

          fileEntity.companyProfileImage = entity as unknown as Company;
          break;
        case FileType.CERTIFICATE_OF_OCCUPANCY:
          if (fileEntity.certificationOfOccupancy) {
            throw new BadRequestException(
              'File is already associated with property',
            );
          }

          fileEntity.certificationOfOccupancy = entity as unknown as Property;
          break;
        case FileType.DEED_OF_CONVEYANCE:
          if (fileEntity.deedOfConveyance) {
            throw new BadRequestException(
              'File is already associated with property',
            );
          }

          fileEntity.deedOfConveyance = entity as unknown as Property;
          break;
        case FileType.SURVEY_PLAN:
          if (fileEntity.surveyPlan) {
            throw new BadRequestException(
              'File is already associated with property',
            );
          }

          fileEntity.surveyPlan = entity as unknown as Property;
          break;
        case FileType.CONTRACT_OF_SALE:
          if (fileEntity.contractOfSale) {
            throw new BadRequestException(
              'File is already associated with property',
            );
          }

          fileEntity.contractOfSale = entity as unknown as Property;
          break;
        case FileType.LETTER_OF_INTENT:
          if (fileEntity.letterOfIntent) {
            throw new BadRequestException(
              'File is already associated with property',
            );
          }

          fileEntity.letterOfIntent = entity as unknown as Property;
          break;
        case FileType.ARTICLE_TITLE_IMAGE:
          if (fileEntity.articleTitleImage) {
            throw new BadRequestException(
              'File is already associated with an article',
            );
          }

          fileEntity.articleTitleImage = entity as unknown as Article;
          break;
        case FileType.VERIFICATION_DOCUMENT:
          if (fileEntity.propertyVerification) {
            throw new BadRequestException(
              'File is already associated with a property verification',
            );
          }

          fileEntity.propertyVerification = entity as unknown as PropertyVerification;
          break;
        case FileType.ADMIN_STAGE_DOCUMENT:
          if (fileEntity.adminPropertyVerification) {
            throw new BadRequestException(
              'File is already associated with a property verification stage',
            );
          }

          fileEntity.adminPropertyVerification = entity as unknown as PropertyVerification;
          break;
        default:
          break;
      }
    } else {
      fileEntity.user = null;
      fileEntity.companyProfileImage = null;
      fileEntity.certificationOfOccupancy = null;
      fileEntity.deedOfConveyance = null;
      fileEntity.surveyPlan = null;
      fileEntity.contractOfSale = null;
      fileEntity.certificationOfOccupancy = null;
      fileEntity.articleTitleImage = null;
      fileEntity.companyAddressFile = null;
      fileEntity.propertyVerification = null;
      fileEntity.adminPropertyVerification = null;
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
