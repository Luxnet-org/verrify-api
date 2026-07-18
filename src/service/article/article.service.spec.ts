import { ForbiddenException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import type { Article } from '../../model/entity/article.entity';
import { UserRole } from '../../model/enum/role.enum';
import type { UserService } from '../user/user.service';
import type { FileService } from '../file/file.service';
import { ArticleService } from './article.service';

jest.mock('../../model/entity/article.entity', () => ({
  Article: class Article {},
}));
jest.mock('../user/user.service', () => ({
  UserService: class UserService {},
}));
jest.mock('../file/file.service', () => ({
  FileService: class FileService {},
}));
jest.mock('../logger/my-logger.service', () => ({
  MyLoggerService: class MyLoggerService {
    log = jest.fn();
  },
}));

describe('ArticleService.delete', () => {
  const creatorId = 'creator-id';
  const article = {
    id: 'article-id',
    createdUser: { id: creatorId },
  } as Article;

  let articleRepository: Pick<Repository<Article>, 'findOne' | 'delete'>;
  let service: ArticleService;

  beforeEach(() => {
    articleRepository = {
      findOne: jest.fn().mockResolvedValue(article),
      delete: jest.fn().mockResolvedValue({ affected: 1, raw: [] }),
    };
    service = new ArticleService(
      articleRepository as Repository<Article>,
      {} as UserService,
      {} as FileService,
    );
  });

  it('allows the article creator to delete the article', async () => {
    await expect(
      service.delete(article.id, creatorId, UserRole.ADMIN),
    ).resolves.toBe('Article is deleted successfully');

    expect(articleRepository.delete).toHaveBeenCalledWith(article.id);
  });

  it('rejects an admin who did not create the article', async () => {
    await expect(
      service.delete(article.id, 'another-admin-id', UserRole.ADMIN),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(articleRepository.delete).not.toHaveBeenCalled();
  });

  it("allows a super admin to delete another creator's article", async () => {
    await expect(
      service.delete(article.id, 'super-admin-id', UserRole.SUPER_ADMIN),
    ).resolves.toBe('Article is deleted successfully');

    expect(articleRepository.delete).toHaveBeenCalledWith(article.id);
  });
});
