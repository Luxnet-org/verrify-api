import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ArticleStatusEnum } from '../enum/article-status-enum';

export class ArticleUpdateRequestDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  slug: string;

  @ApiPropertyOptional()
  @IsOptional()
  content: any;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  featuredFlag: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  titleImage: string;

  @ApiPropertyOptional()
  @IsEnum(ArticleStatusEnum)
  @IsOptional()
  articleStatus: ArticleStatusEnum;
}
