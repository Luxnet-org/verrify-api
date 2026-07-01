import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Auditable } from '../../utility/autitable.entity';
import { FileEntity } from './file.entity';
import { PropertyVersion } from './property-version.entity';

@Entity('property_version_other_document')
@Index('IDX_property_version_other_document_label', ['version', 'label'], {
  unique: true,
})
export class PropertyVersionOtherDocument extends Auditable {
  @ManyToOne(() => PropertyVersion, (version) => version.otherDocuments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  version: PropertyVersion;

  @ManyToOne(() => FileEntity)
  @JoinColumn()
  file: FileEntity;

  @Column({ type: 'character varying' })
  label: string;
}
