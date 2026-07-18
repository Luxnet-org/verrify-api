import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropArticleCreatedUserUniqueConstraint1781000000008
  implements MigrationInterface
{
  name = 'DropArticleCreatedUserUniqueConstraint1781000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "article" DROP CONSTRAINT "UQ_article_created_user"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "article" ADD CONSTRAINT "UQ_article_created_user" UNIQUE ("createdUserId")`,
    );
  }
}
