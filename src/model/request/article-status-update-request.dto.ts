import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ArticleStatusEnum } from '../enum/article-status-enum';

export class ArticleStatusUpdateRequestDto {
  @ApiProperty()
  @IsEnum(ArticleStatusEnum)
  status: ArticleStatusEnum;
}
