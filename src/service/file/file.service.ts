import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { MyLoggerService } from '../logger/my-logger.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, In } from 'typeorm';
import { FileEntity } from '../../model/entity/file.entity';
import { FileType } from '../../model/enum/file-type.enum';
import { User } from '../../model/entity/user.entity';
import { FileResponseDto } from '../../model/response/file-response.dto';
import { Company } from '../../model/entity/company.entity';
import { Property } from '../../model/entity/property.entity';
import { Article } from '../../model/entity/article.entity';
import { PropertyVerification } from '../../model/entity/property-verification.entity';
import { StorageProvider } from '../../model/enum/storage-provider.enum';
import {
  FILE_STORAGE,
  isPublicFileType,
} from './storage/file-storage.constants';
import { FileStorage, SignedFileUrl } from './storage/file-storage.interface';

@Injectable()
export class FileService {
  private readonly logger: MyLoggerService = new MyLoggerService();

  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    @Inject(FILE_STORAGE)
    private readonly fileStorage: FileStorage,
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
    const resolvedUrl = await this.resolveAccessUrl(uploadedFile);
    return {
      fileId: uploadedFile.id,
      url: resolvedUrl.url,
      expiresAt: resolvedUrl.expiresAt,
    };
  }

  async uploadFile<T>(
    file: Express.Multer.File,
    entity: T,
    fileType: FileType,
  ): Promise<FileEntity> {
    const newFile: FileEntity = await this.uploadFileToStorage(file, fileType);
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

  async updateWithFileId<T>(
    fileId: string,
    entity: T,
    fileType: FileType,
    manager?: EntityManager,
  ): Promise<FileEntity> {
    const repo = manager
      ? manager.getRepository(FileEntity)
      : this.fileRepository;
    let findFile: FileEntity | null = await repo.findOne({
      where: { id: fileId },
      relations: [
        'user',
        'companyAddressFile',
        'companyProfileImage',
        'certificationOfOccupancy',
        'contractOfSale',
        'surveyPlan',
        'letterOfIntent',
        'deedOfConveyance',
        'otherDocumentProperty',
        'articleTitleImage',
        'propertyVerification',
        'adminPropertyVerification',
      ],
    });

    if (!findFile) {
      throw new NotFoundException('File not found');
    }

    findFile = await this.updateFile(findFile, entity, fileType, manager);

    this.logger.log('File updated with file ID successfully', FileService.name);
    return findFile;
  }

  async updateFile<T>(
    fileEntity: FileEntity,
    entity: T,
    fileType: FileType,
    manager?: EntityManager,
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

          fileEntity.propertyVerification =
            entity as unknown as PropertyVerification;
          break;
        case FileType.ADMIN_STAGE_DOCUMENT:
          if (fileEntity.adminPropertyVerification) {
            throw new BadRequestException(
              'File is already associated with a property verification stage',
            );
          }

          fileEntity.adminPropertyVerification =
            entity as unknown as PropertyVerification;
          break;
        case FileType.PROPERTY_OTHER_DOCUMENT:
          if (fileEntity.otherDocumentProperty) {
            throw new BadRequestException(
              'File is already associated with property',
            );
          }

          fileEntity.otherDocumentProperty = entity as unknown as Property;
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
      fileEntity.otherDocumentProperty = null;
      fileEntity.otherDocumentLabel = null;
    }

    const repo = manager
      ? manager.getRepository(FileEntity)
      : this.fileRepository;
    const updatedFile: FileEntity = await repo.save(fileEntity);

    this.logger.log('File updated successfully', FileService.name);
    return updatedFile;
  }

  async findFilesByIds(fileIds: string[]): Promise<FileEntity[]> {
    if (fileIds.length === 0) return [];

    const files = await this.fileRepository.find({
      where: { id: In([...new Set(fileIds)]) },
    });
    const filesById = new Map(files.map((file) => [file.id, file]));
    const missingFileId = fileIds.find((fileId) => !filesById.has(fileId));
    if (missingFileId) {
      throw new NotFoundException(`File with id ${missingFileId} not found`);
    }

    return fileIds.map((fileId) => filesById.get(fileId)!);
  }

  async resolveUrl(
    file: FileEntity | null | undefined,
  ): Promise<string | null> {
    if (!file) return null;
    return (await this.resolveAccessUrl(file)).url;
  }

  async resolveUrls(files: FileEntity[]): Promise<string[]> {
    return Promise.all(files.map((file) => this.resolveUrl(file))).then(
      (urls) => urls.filter((url): url is string => url !== null),
    );
  }

  async resolveAccessUrl(file: FileEntity): Promise<SignedFileUrl> {
    if (file.storageProvider === StorageProvider.CLOUDINARY) {
      if (!file.url) {
        throw new InternalServerErrorException(
          `Legacy file ${file.id} does not have a URL`,
        );
      }
      return { url: file.url, expiresAt: null };
    }

    if (isPublicFileType(file.fileType)) {
      if (!file.url) {
        throw new InternalServerErrorException(
          `Public R2 file ${file.id} does not have a URL`,
        );
      }
      return { url: file.url, expiresAt: null };
    }

    if (!file.bucket || !file.objectKey) {
      throw new InternalServerErrorException(
        `Private R2 file ${file.id} is missing storage metadata`,
      );
    }

    return this.fileStorage.createSignedDownloadUrl(
      file.bucket,
      file.objectKey,
      file.originalFileName,
    );
  }

  private async uploadFileToStorage(
    file: Express.Multer.File,
    fileType: FileType,
  ): Promise<FileEntity> {
    const storedFile = await this.fileStorage.upload(
      file,
      fileType,
      isPublicFileType(fileType),
    );

    this.logger.log('File uploaded to R2 successfully', FileService.name);
    return this.fileRepository.create({
      fileName: storedFile.objectKey,
      url: storedFile.url,
      storageProvider: storedFile.storageProvider,
      bucket: storedFile.bucket,
      objectKey: storedFile.objectKey,
      originalFileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    });
  }
}
