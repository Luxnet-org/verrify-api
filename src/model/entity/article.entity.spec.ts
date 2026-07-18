import { getMetadataArgsStorage } from 'typeorm';
import { Article } from './article.entity';

jest.mock('./file.entity', () => ({ FileEntity: class FileEntity {} }));
jest.mock('./user.entity', () => ({ User: class User {} }));

describe('Article entity', () => {
  it('allows a user to create multiple articles', () => {
    const createdUserRelation = getMetadataArgsStorage().relations.find(
      ({ target, propertyName }) =>
        target === Article && propertyName === 'createdUser',
    );

    expect(createdUserRelation?.relationType).toBe('many-to-one');
  });
});
