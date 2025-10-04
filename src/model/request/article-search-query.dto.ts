import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ArticleStatusEnum } from '../enum/article-status-enum';
import { PaginationQueryDto } from '../../utility/pagination-and-sorting';

export class ArticleSearchQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'This is the field to filter by article status',
  })
  @IsOptional()
  @IsEnum(ArticleStatusEnum)
  status: ArticleStatusEnum;
}
