import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    Index,
} from 'typeorm';
import { Auditable } from '../../utility/autitable.entity';
import { VerificationStageStatus } from '../enum/verification-stage-status.enum';
import { Property } from './property.entity';
import { User } from './user.entity';
import { FileEntity } from './file.entity';

@Entity()
export class PropertyVerification extends Auditable {
    @Column({ type: 'enum', enum: VerificationStageStatus, default: VerificationStageStatus.INITIATED })
    stage: VerificationStageStatus;

    @Index({ unique: true, where: '"caseId" IS NOT NULL' })
    @Column({ type: 'varchar', nullable: true })
    caseId: string;

    @ManyToOne(() => Property)
    @JoinColumn()
    property: Property;

    @ManyToOne(() => User)
    @JoinColumn()
    user: User;

    @Column({ type: 'simple-json', nullable: true })
    adminComments: any;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn()
    reviewUser: User;

    @Column({ type: 'timestamp with time zone', nullable: true })
    reviewedAt: Date;

    @OneToMany(() => FileEntity, (file) => file.propertyVerification)
    verificationFiles: FileEntity[];

    @OneToMany(() => FileEntity, (file) => file.adminPropertyVerification)
    adminStageFiles: FileEntity[];

}
