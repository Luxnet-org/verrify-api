import { Auditable } from 'src/utility/autitable.entity';
import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { FileType } from '../enum/file-type.enum';
import { User } from './user.entity';
import { Company } from './company.entity';
import { Property } from './property.entity';
import { Article } from './article.entity';

@Entity('file')
export class FileEntity extends Auditable {
  @Column({ type: 'enum', enum: FileType })
  fileType: FileType;

  @Column({ type: 'character varying', unique: true })
  url: string;

  @Column({ type: 'character varying' })
  fileName: string;

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

  @OneToOne(() => Article, (article) => article.titleImage)
  @JoinColumn()
  articleTitleImage: Article | null;
}
