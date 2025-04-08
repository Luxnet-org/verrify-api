import { Auditable } from 'src/utility/autitable.entity';
import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { FileType } from '../enum/file-type.enum';
import { User } from './user.entity';

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
}
