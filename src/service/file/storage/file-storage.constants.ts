import { FileType } from '../../../model/enum/file-type.enum';

const PUBLIC_FILE_TYPES = new Set<FileType>([
  FileType.PROFILE_PICTURE,
  FileType.COMPANY_PROFILE_PICTURE,
  FileType.ARTICLE_TITLE_IMAGE,
]);

export const isPublicFileType = (fileType: FileType): boolean =>
  PUBLIC_FILE_TYPES.has(fileType);
