import { Entity } from 'typeorm';
import { Auditable } from '../../utility/autitable.entity';
import { UserRole } from '../enum/role.enum';
import { FileEntity } from './file.entity';
import { Column, OneToOne } from 'typeorm';
import { LocationEntity } from './location.entity';
import { Company } from './company.entity';

@Entity('users')
export class User extends Auditable {
  @Column({ type: 'character varying' })
  firstName: string;

  @Column({ type: 'character varying', nullable: true })
  lastName: string;

  @Column({ type: 'date', nullable: true })
  dob: Date;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Column({ type: 'character varying', unique: true, nullable: true })
  username: string;

  @Column({ type: 'character varying', unique: true })
  email: string;

  @Column({ type: 'character varying' })
  passwordHash: string;

  @Column({ type: 'character varying', nullable: true })
  phoneNumber: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastLogin: Date;

  @Column({ type: 'character varying', nullable: true })
  fcmToken: string;

  @Column({ type: 'boolean', default: false })
  is2fa: boolean;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ type: 'boolean', default: false })
  isGoogleLogin: boolean;

  @Column({ type: 'boolean' })
  isAgreed: boolean;

  @Column({ type: 'boolean', default: false })
  isEnabled: boolean;

  // Relationships
  @OneToOne(() => FileEntity, (file) => file.user)
  profileImage: FileEntity;

  @OneToOne(() => LocationEntity, (location) => location.user, {
    cascade: true,
  })
  address: LocationEntity;

  @OneToOne(() => Company, (company) => company.user)
  company: Company;
}
