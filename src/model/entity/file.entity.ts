import { Auditable } from 'src/utility/autitable.entity';
import { Entity, Column, ManyToOne } from 'typeorm';
import { FileType } from '../enum/file-type.enum';
import { User } from './user.entity';

@Entity('file')
export class FileEntity extends Auditable {
  @Column({ type: 'enum', enum: FileType })
  fileType: FileType;

  @Column({ type: 'character varying' })
  url: string;

  @Column({ type: 'character varying' })
  fileName: string;

  @ManyToOne(() => User, (user) => user.id)
  user: User;
}
