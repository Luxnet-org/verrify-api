import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  Index,
} from 'typeorm';
import { Auditable } from '../../utility/autitable.entity';
import { PropertyType } from '../enum/property-type.enum';
import { PropertyVerificationStatus } from '../enum/property-verification-status.enum';
import { Company } from './company.entity';
import { LocationEntity } from './location.entity';
import { FileEntity } from './file.entity';
import { User } from './user.entity';
import { PropertyVerificationVersion } from './property-verification-version.entity';

@Entity()
export class Property extends Auditable {
  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Index()
  @Column({ type: 'varchar', nullable: true, unique: true })
  pin: string | null;

  @Column({ type: 'boolean', default: false })
  isSubProperty: boolean;

  @Column({ type: 'enum', enum: PropertyType })
  propertyType: PropertyType;

  @Column({ type: 'boolean', default: false })
  isPublic: boolean;

  @Column({ type: 'enum', enum: PropertyVerificationStatus })
  propertyVerificationStatus: PropertyVerificationStatus;

  @Column({ type: 'text', nullable: true })
  verificationMessage: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn()
  reviewUser: User | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  reviewedAt: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  verifiedAt: Date | null;

  @Column({ type: 'double precision', nullable: true })
  area: number | null;

  @ManyToOne(() => Company, { nullable: true })
  @JoinColumn()
  company: Company;

  @OneToOne(() => LocationEntity, (location) => location.property)
  location: LocationEntity | null;

  @OneToOne(() => FileEntity, (file) => file.certificationOfOccupancy)
  certificationOfOccupancy: FileEntity | null;

  @OneToOne(() => FileEntity, (file) => file.contractOfSale)
  contractOfSale: FileEntity | null;

  @OneToOne(() => FileEntity, (file) => file.surveyPlan)
  surveyPlan: FileEntity | null;

  @OneToOne(() => FileEntity, (file) => file.deedOfConveyance)
  deedOfConveyance: FileEntity | null;

  @OneToMany(() => FileEntity, (file) => file.otherDocumentProperty)
  otherDocuments: FileEntity[];

  // Optional
  @OneToOne(() => FileEntity, (file) => file.letterOfIntent)
  letterOfIntent: FileEntity | null;

  @ManyToOne(() => PropertyVerificationVersion, { nullable: true })
  @JoinColumn()
  currentVerificationVersion: PropertyVerificationVersion | null;

  @OneToMany(() => PropertyVerificationVersion, (version) => version.property)
  verificationVersions: PropertyVerificationVersion[];

  @ManyToOne(() => Property)
  @JoinColumn()
  parentProperty: Property | null;

  // For sub-property
  @ManyToMany(() => User)
  @JoinTable({
    name: 'user_property',
    joinColumn: { name: 'propertyId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  users: User[];
}
