import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MyLoggerService } from '../logger/my-logger.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Article } from 'src/model/entity/article.entity';
import { Repository } from 'typeorm';
import { ArticleDto } from '../../model/dto/article.dto';
import { ArticleCreateRequestDto } from '../../model/request/article-create-request.dto';
import { DateUtility } from '../../utility/date-utility';
import { ArticleStatusEnum } from '../../model/enum/article-status-enum';
import { User } from '../../model/entity/user.entity';
import { UserService } from '../user/user.service';
import { FileService } from '../file/file.service';
import { FileType } from '../../model/enum/file-type.enum';
import { ArticleUpdateRequestDto } from '../../model/request/article-update.request.dto';
import { ArticleStatusUpdateRequestDto } from '../../model/request/article-status-update-request.dto';
import {
  PaginationAndSorting,
  PaginationAndSortingResult,
  PaginationQueryDto,
} from '../../utility/pagination-and-sorting';
import { ArticleListResponseDto } from '../../model/response/article-list-response.dto';
import { ArticleSearchQueryDto } from '../../model/request/article-search-query.dto';
import { UserRole } from '../../model/enum/role.enum';

@Injectable()
export class ArticleService {
  private readonly logger: MyLoggerService = new MyLoggerService(
    ArticleService.name,
  );

  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    private readonly userService: UserService,
    private readonly fileService: FileService,
  ) {}

  async create(
    request: ArticleCreateRequestDto,
    userId: string,
  ): Promise<ArticleDto> {
    const findArticle: Article | null = await this.articleRepository.findOne({
      where: {
        slug: request.slug.toLowerCase(),
      },
    });

    if (findArticle) {
      throw new BadRequestException(
        `Article with slug: ${request.slug} already exists`,
      );
    }

    const slug = request.slug?.trim();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new BadRequestException(
        'Slug cannot contain spaces, start or end with hyphens',
      );
    }

    const user: User = await this.userService.findById(userId);

    let article = this.articleRepository.create({
      title: request.title.toLowerCase(),
      description: request.description,
      content: request.content,
      slug: request.slug.toLowerCase(),
      articleStatus: request.articleStatus,
      createdUser: user,
      featuredFlag: request.featuredFlag,
    });

    if (request.articleStatus === ArticleStatusEnum.PUBLISHED) {
      article.publishedAt = DateUtility.currentDate;
    }

    article = await this.articleRepository.save(article);

    article.titleImage = await this.fileService.updateWithUrl(
      request.titleImage,
      article,
      FileType.ARTICLE_TITLE_IMAGE,
    );

    this.logger.log(`Article created by ${user.id}`, ArticleService.name);
    return this.convertToDto(article);
  }

  async update(
    articleId: string,
    request: ArticleUpdateRequestDto,
  ): Promise<ArticleDto> {
    let findArticle: Article = await this.findById(articleId, [
      'titleImage',
      'createdUser',
    ]);

    if (request.title) {
      findArticle.title = request.title.toLowerCase();
    }

    if (request.description) {
      findArticle.description = request.description;
    }

    if (request.slug) {
      const slugArticle: Article | null = await this.articleRepository.findOne({
        where: {
          slug: request.slug.toLowerCase(),
        },
      });

      if (slugArticle) {
        throw new BadRequestException(
          `Article with slug: ${request.slug} already exists `,
        );
      }

      const slug = request.slug.trim();
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        throw new BadRequestException(
          'Slug cannot contain spaces, start, end with hyphens or any other symbols.',
        );
      }

      findArticle.slug = request.slug.toLowerCase();
    }

    if (request.content) {
      findArticle.content = request.content;
    }

    findArticle.featuredFlag = request.featuredFlag;

    if (request.titleImage) {
      await this.fileService.updateFile(
        findArticle.titleImage,
        null,
        FileType.ARTICLE_TITLE_IMAGE,
      );

      findArticle.titleImage = await this.fileService.updateWithUrl(
        request.titleImage,
        findArticle,
        FileType.ARTICLE_TITLE_IMAGE,
      );
    }

    findArticle = await this.articleRepository.save(findArticle);

    this.logger.log(
      `Article ${findArticle.id} was modified`,
      ArticleService.name,
    );

    return this.convertToDto(findArticle);
  }

  async updateStatus(
    articleId: string,
    request: ArticleStatusUpdateRequestDto,
  ): Promise<ArticleDto> {
    let findArticle: Article = await this.findById(articleId, ['titleImage']);

    findArticle.articleStatus = request.status;

    if (request.status === ArticleStatusEnum.PUBLISHED) {
      findArticle.publishedAt = DateUtility.currentDate;
    } else if (request.status === ArticleStatusEnum.DRAFT) {
      findArticle.publishedAt = undefined;
    }

    findArticle = await this.articleRepository.save(findArticle);

    this.logger.log(
      `Article ${findArticle.id} status was modified`,
      ArticleService.name,
    );

    return this.convertToDto(findArticle);
  }

  async delete(articleId: string): Promise<string> {
    const findArticle: Article = await this.findById(articleId);

    await this.articleRepository.delete(findArticle);

    this.logger.log(
      `Article ${findArticle.id} was deleted`,
      ArticleService.name,
    );

    return 'Article is deleted successfully';
  }

  async getOneAdmin({
    articleId,
    slug,
  }: {
    articleId?: string;
    slug?: string;
  }): Promise<ArticleDto> {
    let findArticle: Article;
    if (articleId) {
      findArticle = await this.findById(articleId, [
        'titleImage',
        'createdUser',
      ]);
    } else {
      findArticle = await this.findBySlug(slug!, ['titleImage', 'createdUser']);
    }

    return this.convertToDto(findArticle);
  }

  async getOne({
    articleId,
    slug,
  }: {
    articleId?: string;
    slug?: string;
  }): Promise<ArticleDto> {
    let findArticle: Article;
    if (articleId) {
      findArticle = await this.findById(articleId, [
        'titleImage',
        'createdUser',
      ]);
    } else {
      findArticle = await this.findBySlug(slug!, ['titleImage', 'createdUser']);
    }

    if (findArticle.articleStatus !== ArticleStatusEnum.PUBLISHED) {
      throw new NotFoundException('Article does not exist');
    }

    return this.convertToDto(findArticle);
  }

  async getAllPublished(
    pageQuery: PaginationQueryDto,
  ): Promise<PaginationAndSortingResult<ArticleListResponseDto>> {
    const findOptions = PaginationAndSorting.createFindOptions<Article>(
      ['title', 'description'],
      pageQuery,
      {},
      { articleStatus: ArticleStatusEnum.PUBLISHED },
      ['titleImage', 'createdUser'],
    );

    const [articles, count] =
      await this.articleRepository.findAndCount(findOptions);

    return PaginationAndSorting.getPaginateResult(
      articles,
      count,
      pageQuery,
      (article: Article): ArticleListResponseDto => {
        return {
          id: article.id,
          title: article.title,
          titleImage: article.titleImage.url,
          description: article.description,
          slug: article.slug,
          publishedAt: article.publishedAt,
          articleStatus: article.articleStatus,
          featuredFlag: article.featuredFlag,
        };
      },
    );
  }

  async getAllAdmin(
    pageQuery: ArticleSearchQueryDto,
  ): Promise<PaginationAndSortingResult<ArticleListResponseDto>> {
    const compulsoryWhere = pageQuery.status
      ? { articleStatus: pageQuery.status }
      : {};

    const findOptions = PaginationAndSorting.createFindOptions<Article>(
      ['title', 'description'],
      pageQuery,
      {},
      compulsoryWhere,
      ['titleImage', 'createdUser'],
    );

    const [articles, count] =
      await this.articleRepository.findAndCount(findOptions);

    return PaginationAndSorting.getPaginateResult(
      articles,
      count,
      pageQuery,
      (article: Article): ArticleListResponseDto => {
        return {
          id: article.id,
          title: article.title,
          titleImage: article.titleImage.url,
          description: article.description,
          slug: article.slug,
          publishedAt: article.publishedAt,
          articleStatus: article.articleStatus,
          featuredFlag: article.featuredFlag,
        };
      },
    );
  }

  async findById(
    articleId: string,
    relations: string[] = [],
  ): Promise<Article> {
    const article: Article | null = await this.articleRepository.findOne({
      where: {
        id: articleId,
      },
      relations,
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    return article;
  }

  async findBySlug(slug: string, relations: string[] = []): Promise<Article> {
    const article: Article | null = await this.articleRepository.findOne({
      where: {
        slug,
      },
      relations,
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    return article;
  }

  private convertToDto(article: Article): ArticleDto {
    return {
      id: article.id,
      title: article.title,
      titleImage: article.titleImage.url,
      description: article.description,
      slug: article.slug,
      content: article.content,
      publishedAt: article.publishedAt,
      articleStatus: article.articleStatus,
      featuredFlag: article.featuredFlag,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
    };
  }
}
