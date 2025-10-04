import { DateDto } from '../../utility/date.dto';
import { ArticleStatusEnum } from '../enum/article-status-enum';
import { ApiProperty } from '@nestjs/swagger';

export class ArticleDto extends DateDto {
  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  content: any;

  @ApiProperty()
  publishedAt?: Date;

  @ApiProperty()
  articleStatus: ArticleStatusEnum;

  @ApiProperty()
  featuredFlag: boolean;

  @ApiProperty()
  titleImage: string;
}
