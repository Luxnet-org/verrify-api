import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { Auditable } from '../../utility/autitable.entity';
import { ArticleStatusEnum } from '../enum/article-status-enum';
import { FileEntity } from './file.entity';
import { User } from './user.entity';

@Entity()
export class Article extends Auditable {
  @Column({ type: 'character varying', nullable: false })
  title: string;

  @Column({ type: 'text', nullable: false })
  description: string;

  @Column({ type: 'character varying', nullable: false, unique: true })
  slug: string;

  @Column({ type: 'jsonb', nullable: false })
  content: any;

  @Column({ type: 'timestamp with time zone', nullable: true })
  publishedAt?: Date;

  @Column({ type: 'enum', enum: ArticleStatusEnum, nullable: false })
  articleStatus: ArticleStatusEnum;

  @Column({ type: 'boolean', default: false })
  featuredFlag: boolean;

  @OneToOne(() => FileEntity, (file) => file.articleTitleImage)
  titleImage: FileEntity;

  @OneToOne(() => User)
  @JoinColumn()
  createdUser: User;
}
