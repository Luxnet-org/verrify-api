import { getMetadataArgsStorage } from 'typeorm';
import { FileEntity } from './file.entity';

jest.mock('./user.entity', () => ({ User: class User {} }));
jest.mock('./company.entity', () => ({ Company: class Company {} }));
jest.mock('./property.entity', () => ({ Property: class Property {} }));
jest.mock('./article.entity', () => ({ Article: class Article {} }));
jest.mock('./property-verification.entity', () => ({
  PropertyVerification: class PropertyVerification {},
}));

describe('File entity', () => {
  it('clears the title-image association when an article is deleted', () => {
    const articleTitleImageRelation = getMetadataArgsStorage().relations.find(
      ({ target, propertyName }) =>
        target === FileEntity && propertyName === 'articleTitleImage',
    );

    expect(articleTitleImageRelation?.options.onDelete).toBe('SET NULL');
  });
});
