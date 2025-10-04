import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ArticleService } from '../service/article/article.service';
import { Public } from '../common/decorator/public.decorator';
import {
  SwaggerApiPaginatedResponseData,
  SwaggerApiResponseData,
} from '../common/decorator/swagger.decorator';
import { ArticleListResponseDto } from '../model/response/article-list-response.dto';
import {
  PaginationAndSortingResult,
  PaginationQueryDto,
} from '../utility/pagination-and-sorting';
import { ApiResponse } from '../utility/api-response';
import { RequireRoles } from '../common/decorator/role.decorator';
import { UserRole } from '../model/enum/role.enum';
import { ArticleSearchQueryDto } from '../model/request/article-search-query.dto';
import { ArticleDto } from '../model/dto/article.dto';
import { ArticleCreateRequestDto } from '../model/request/article-create-request.dto';
import { Request } from 'express';
import { UserInfo } from '../common/guards/auth.guard';
import { ArticleUpdateRequestDto } from '../model/request/article-update.request.dto';
import { ArticleStatusUpdateRequestDto } from '../model/request/article-status-update-request.dto';

@ApiTags('Blog Article API')
@Controller('article')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Public()
  @ApiOperation({ summary: 'Api endpoint for get all published articles' })
  @SwaggerApiPaginatedResponseData({
    dataClass: ArticleListResponseDto,
    status: HttpStatus.CREATED,
  })
  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllPublishedArticles(
    @Query() pageQuery: PaginationQueryDto,
  ): Promise<ApiResponse<PaginationAndSortingResult<ArticleListResponseDto>>> {
    const response = await this.articleService.getAllPublished(pageQuery);
    return ApiResponse.success(response, HttpStatus.OK);
  }

  @RequireRoles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Api endpoint for get all articles for admin accounts (auth)',
  })
  @SwaggerApiPaginatedResponseData({
    dataClass: ArticleListResponseDto,
    status: HttpStatus.CREATED,
  })
  @Get('/admin')
  @HttpCode(HttpStatus.OK)
  async getAllArticles(
    @Query() pageQuery: ArticleSearchQueryDto,
  ): Promise<ApiResponse<PaginationAndSortingResult<ArticleListResponseDto>>> {
    const response = await this.articleService.getAllAdmin(pageQuery);
    return ApiResponse.success(response, HttpStatus.OK);
  }

  @RequireRoles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Api endpoint to create article (auth)' })
  @SwaggerApiResponseData({
    dataClass: ArticleDto,
    status: HttpStatus.CREATED,
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createRequest: ArticleCreateRequestDto,
    @Req() request: Request,
  ): Promise<ApiResponse<ArticleDto>> {
    const userInfo: UserInfo = request.user!;
    const response = await this.articleService.create(
      createRequest,
      userInfo.userId,
    );
    return ApiResponse.success(response, HttpStatus.OK);
  }

  @RequireRoles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Api endpoint to get single article by article ID (auth)',
  })
  @SwaggerApiResponseData({
    dataClass: ArticleDto,
    status: HttpStatus.OK,
  })
  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  async getOneById(@Param('id') id: string): Promise<ApiResponse<ArticleDto>> {
    const response: ArticleDto = await this.articleService.getOneAdmin({
      articleId: id,
    });

    return ApiResponse.success(response, HttpStatus.OK);
  }

  @Public()
  @ApiOperation({ summary: 'Api endpoint to get single article by article ID' })
  @SwaggerApiResponseData({
    dataClass: ArticleDto,
    status: HttpStatus.OK,
  })
  @Get('/p/:id')
  @HttpCode(HttpStatus.OK)
  async getOneByIdPublix(
    @Param('id') id: string,
  ): Promise<ApiResponse<ArticleDto>> {
    const response: ArticleDto = await this.articleService.getOne({
      articleId: id,
    });

    return ApiResponse.success(response, HttpStatus.OK);
  }

  @RequireRoles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Api endpoint to update article by article ID (auth)',
  })
  @SwaggerApiResponseData({
    dataClass: ArticleDto,
    status: HttpStatus.OK,
  })
  @Patch('/:id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() requestBody: ArticleUpdateRequestDto,
  ): Promise<ApiResponse<ArticleDto>> {
    const response = await this.articleService.update(id, requestBody);
    return ApiResponse.success(response, HttpStatus.OK);
  }

  @RequireRoles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Api endpoint to update article status by article ID (auth)',
  })
  @SwaggerApiResponseData({
    dataClass: ArticleDto,
    status: HttpStatus.OK,
  })
  @Patch('/status/:id')
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @Param('id') id: string,
    @Body() requestBody: ArticleStatusUpdateRequestDto,
  ): Promise<ApiResponse<ArticleDto>> {
    const response = await this.articleService.updateStatus(id, requestBody);
    return ApiResponse.success(response, HttpStatus.OK);
  }

  @RequireRoles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Api endpoint to update article by article ID (auth)',
  })
  @SwaggerApiResponseData({
    type: 'string',
    status: HttpStatus.OK,
  })
  @Delete('/:id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string): Promise<ApiResponse<string>> {
    const response = await this.articleService.delete(id);
    return ApiResponse.success(response, HttpStatus.OK);
  }

  @RequireRoles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Api endpoint to get single article by article slug (auth)',
  })
  @SwaggerApiResponseData({
    dataClass: ArticleDto,
    status: HttpStatus.OK,
  })
  @Get('/s/:slug')
  @HttpCode(HttpStatus.OK)
  async getOneBySlug(
    @Param('slug') slug: string,
  ): Promise<ApiResponse<ArticleDto>> {
    const response: ArticleDto = await this.articleService.getOneAdmin({
      slug,
    });
    return ApiResponse.success(response, HttpStatus.OK);
  }

  @Public()
  @ApiOperation({
    summary: 'Api endpoint to get single article by article slug',
  })
  @SwaggerApiResponseData({
    dataClass: ArticleDto,
    status: HttpStatus.OK,
  })
  @Get('/p/s/:slug')
  @HttpCode(HttpStatus.OK)
  async getOneBySlugPublic(
    @Param('slug') slug: string,
  ): Promise<ApiResponse<ArticleDto>> {
    const response: ArticleDto = await this.articleService.getOne({
      slug,
    });
    return ApiResponse.success(response, HttpStatus.OK);
  }
}
