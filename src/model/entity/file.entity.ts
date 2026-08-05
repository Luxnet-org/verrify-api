import { Auditable } from '../../utility/autitable.entity';
import {
  Entity,
  Column,
  OneToOne,
  JoinColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { FileType } from '../enum/file-type.enum';
import { User } from './user.entity';
import { Company } from './company.entity';
import { Property } from './property.entity';
import { Article } from './article.entity';
import { PropertyVerification } from './property-verification.entity';
import { StorageProvider } from '../enum/storage-provider.enum';

@Entity('file')
@Index('IDX_file_r2_bucket_object_key', ['bucket', 'objectKey'], {
  unique: true,
  where: '"bucket" IS NOT NULL AND "objectKey" IS NOT NULL',
})
export class FileEntity extends Auditable {
  @Column({ type: 'enum', enum: FileType })
  fileType: FileType;

  @Column({ type: 'character varying', unique: true, nullable: true })
  url: string | null;

  @Column({ type: 'character varying' })
  fileName: string;

  @Column({
    type: 'enum',
    enum: StorageProvider,
    default: StorageProvider.CLOUDINARY,
  })
  storageProvider: StorageProvider;

  @Column({ type: 'character varying', nullable: true })
  bucket: string | null;

  @Column({ type: 'character varying', nullable: true })
  objectKey: string | null;

  @Column({ type: 'character varying', nullable: true })
  originalFileName: string | null;

  @Column({ type: 'character varying', nullable: true })
  mimeType: string | null;

  @Column({ type: 'integer', nullable: true })
  size: number | null;

  @OneToOne(() => User, (user) => user.profileImage)
  @JoinColumn()
  user: User | null;

  @OneToOne(() => Company, (company) => company.proofOfAddress)
  @JoinColumn()
  companyAddressFile: Company | null;

  @OneToOne(() => Company, (company) => company.profileImage)
  @JoinColumn()
  companyProfileImage: Company | null;

  @OneToOne(() => Property, (property) => property.certificationOfOccupancy)
  @JoinColumn()
  certificationOfOccupancy: Property | null;

  @OneToOne(() => Property, (property) => property.contractOfSale)
  @JoinColumn()
  contractOfSale: Property | null;

  @OneToOne(() => Property, (property) => property.surveyPlan)
  @JoinColumn()
  surveyPlan: Property | null;

  @OneToOne(() => Property, (property) => property.letterOfIntent)
  @JoinColumn()
  letterOfIntent: Property | null;

  @OneToOne(() => Property, (property) => property.deedOfConveyance)
  @JoinColumn()
  deedOfConveyance: Property | null;

  @ManyToOne(() => Property, (property) => property.otherDocuments)
  @JoinColumn()
  otherDocumentProperty: Property | null;

  @Column({ type: 'character varying', nullable: true })
  otherDocumentLabel: string | null;

  @OneToOne(() => Article, (article) => article.titleImage, {
    onDelete: 'SET NULL',
  })
  @JoinColumn()
  articleTitleImage: Article | null;

  @ManyToOne(
    () => PropertyVerification,
    (verification) => verification.verificationFiles,
  )
  @JoinColumn()
  propertyVerification: PropertyVerification | null;

  @ManyToOne(
    () => PropertyVerification,
    (verification) => verification.adminStageFiles,
  )
  @JoinColumn()
  adminPropertyVerification: PropertyVerification | null;
}
