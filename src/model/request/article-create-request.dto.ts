import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ArticleStatusEnum } from '../enum/article-status-enum';

export class ArticleCreateRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty()
  @IsNotEmpty()
  content: any;

  @ApiProperty()
  @IsBoolean()
  featuredFlag: boolean;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  titleImage: string;

  @ApiProperty()
  @IsEnum(ArticleStatusEnum)
  @IsNotEmpty()
  articleStatus: ArticleStatusEnum;
}
