import { ApiProperty } from '@nestjs/swagger';
import { ArticleStatusEnum } from '../enum/article-status-enum';

export class ArticleListResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  publishedAt?: Date;

  @ApiProperty()
  articleStatus: ArticleStatusEnum;

  @ApiProperty()
  featuredFlag: boolean;

  @ApiProperty()
  titleImage: string;
}
