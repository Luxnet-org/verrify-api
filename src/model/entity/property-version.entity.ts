import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Polygon } from 'geojson';
import { Auditable } from '../../utility/autitable.entity';
import { PropertyType } from '../enum/property-type.enum';
import { PropertyVerificationStatus } from '../enum/property-verification-status.enum';
import { FileEntity } from './file.entity';
import { Property } from './property.entity';
import { PropertyVersionOtherDocument } from './property-version-other-document.entity';
import { User } from './user.entity';

@Entity('property_version')
export class PropertyVersion extends Auditable {
  @ManyToOne(() => Property, (property) => property.versions)
  @JoinColumn()
  property: Property;

  @Column({
    type: 'enum',
    enum: PropertyVerificationStatus,
    default: PropertyVerificationStatus.PENDING,
  })
  status: PropertyVerificationStatus;

  @Column({ type: 'enum', enum: PropertyType })
  propertyType: PropertyType;

  @Column({ type: 'character varying', nullable: true })
  address: string | null;

  @Column({ type: 'character varying', nullable: true })
  city: string | null;

  @Column({ type: 'character varying', nullable: true })
  state: string | null;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Polygon',
    srid: 4326,
    nullable: true,
  })
  locationPolygon: Polygon | null;

  @Column({ type: 'double precision', nullable: true })
  area: number | null;

  @ManyToOne(() => FileEntity, { nullable: true })
  @JoinColumn()
  certificationOfOccupancy: FileEntity | null;

  @ManyToOne(() => FileEntity, { nullable: true })
  @JoinColumn()
  contractOfSale: FileEntity | null;

  @ManyToOne(() => FileEntity, { nullable: true })
  @JoinColumn()
  surveyPlan: FileEntity | null;

  @ManyToOne(() => FileEntity, { nullable: true })
  @JoinColumn()
  letterOfIntent: FileEntity | null;

  @ManyToOne(() => FileEntity, { nullable: true })
  @JoinColumn()
  deedOfConveyance: FileEntity | null;

  @OneToMany(() => PropertyVersionOtherDocument, (document) => document.version)
  otherDocuments: PropertyVersionOtherDocument[];

  @ManyToMany(() => User)
  @JoinTable({
    name: 'property_version_user',
    joinColumn: { name: 'versionId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  users: User[];

  @Column({ type: 'simple-json', nullable: true })
  adminComments: string | null;

  @Column({ type: 'simple-json', default: '[]' })
  statusHistory: { status: PropertyVerificationStatus; changedAt: Date }[];
}
