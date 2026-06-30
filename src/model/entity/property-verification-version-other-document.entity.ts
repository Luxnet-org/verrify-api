import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Auditable } from '../../utility/autitable.entity';
import { FileEntity } from './file.entity';
import { PropertyVerificationVersion } from './property-verification-version.entity';

@Entity()
@Index('IDX_version_other_document_label', ['version', 'label'], {
  unique: true,
})
export class PropertyVerificationVersionOtherDocument extends Auditable {
  @ManyToOne(
    () => PropertyVerificationVersion,
    (version) => version.otherDocuments,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn()
  version: PropertyVerificationVersion;

  @ManyToOne(() => FileEntity)
  @JoinColumn()
  file: FileEntity;

  @Column({ type: 'character varying' })
  label: string;
}
