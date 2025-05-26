import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToOne,
} from 'typeorm';
import { Auditable } from '../../utility/autitable.entity';
import { PropertyType } from '../enum/property-type.enum';
import { PropertyVerificationStatus } from '../enum/property-verification-status.enum';
import { Company } from './company.entity';
import { LocationEntity } from './location.entity';
import { FileEntity } from './file.entity';
import { User } from './user.entity';

@Entity()
export class Property extends Auditable {
  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: false })
  isSubProperty: boolean;

  @Column({ type: 'enum', enum: PropertyType })
  propertyType: PropertyType;

  @Column({ type: 'boolean', default: false })
  isPublic: boolean;

  @Column({ type: 'enum', enum: PropertyVerificationStatus })
  propertyVerificationStatus: PropertyVerificationStatus;

  @Column({ type: 'text', nullable: true })
  verificationMessage: string;

  @Column({ type: 'double precision', nullable: true })
  area: number;

  @ManyToOne(() => Company)
  @JoinColumn()
  company: Company;

  @OneToOne(() => LocationEntity, (location) => location.property)
  location: LocationEntity;

  @OneToOne(() => FileEntity, (file) => file.certificationOfOccupancy)
  certificationOfOccupancy: FileEntity;

  @OneToOne(() => FileEntity, (file) => file.contractOfSale)
  contractOfSale: FileEntity;

  @OneToOne(() => FileEntity, (file) => file.surveyPlan)
  surveyPlan: FileEntity;

  @OneToOne(() => FileEntity, (file) => file.deedOfConveyance)
  deedOfConveyance: FileEntity;

  // Optional
  @OneToOne(() => FileEntity, (file) => file.letterOfIntent)
  letterOfIntent: FileEntity;

  @ManyToOne(() => Property)
  @JoinColumn()
  parentProperty: Property;

  // For sub-property
  @ManyToMany(() => User)
  @JoinTable({
    name: 'user_property',
    joinColumn: { name: 'propertyId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  users: User[];
}
