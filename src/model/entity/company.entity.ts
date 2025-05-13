import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { Auditable } from '../../utility/autitable.entity';
import { LocationEntity } from './location.entity';
import { AddressFileTypeEnum } from '../enum/address-file-type.enum';
import { FileEntity } from './file.entity';
import { User } from './user.entity';
import { CompanyVerificationStatus } from '../enum/company-verification-status.enum';

@Entity()
export class Company extends Auditable {
  @Column({ type: 'character varying', nullable: true, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'character varying', nullable: true })
  phoneNumber: string;

  @Column({ type: 'enum', enum: CompanyVerificationStatus })
  companyVerificationStatus: CompanyVerificationStatus;

  @Column({ type: 'text', nullable: true })
  verificationMessage: string;

  @Column({ type: 'enum', enum: AddressFileTypeEnum, nullable: true })
  proofOfAddressType: AddressFileTypeEnum;

  @OneToOne(() => FileEntity, (file) => file.companyAddressFile)
  proofOfAddress: FileEntity;

  @OneToOne(() => FileEntity, (file) => file.companyProfileImage)
  profileImage: FileEntity;

  @OneToOne(() => LocationEntity, (location) => location.company, {
    cascade: true,
  })
  address: LocationEntity;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;
}
