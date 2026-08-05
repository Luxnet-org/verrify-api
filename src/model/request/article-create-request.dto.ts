import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUUID,
} from 'class-validator';
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
  content: unknown;

  @ApiProperty()
  @IsBoolean()
  featuredFlag: boolean;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  titleImageId: string;

  @ApiProperty()
  @IsEnum(ArticleStatusEnum)
  @IsNotEmpty()
  articleStatus: ArticleStatusEnum;
}
