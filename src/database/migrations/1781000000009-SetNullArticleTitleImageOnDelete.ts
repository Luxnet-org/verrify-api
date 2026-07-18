import { MigrationInterface, QueryRunner } from 'typeorm';

export class SetNullArticleTitleImageOnDelete1781000000009
  implements MigrationInterface
{
  name = 'SetNullArticleTitleImageOnDelete1781000000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "file" DROP CONSTRAINT "FK_4d57d2a7eac64846a2d9243c697"`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ADD CONSTRAINT "FK_4d57d2a7eac64846a2d9243c697" FOREIGN KEY ("articleTitleImageId") REFERENCES "article"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "file" DROP CONSTRAINT "FK_4d57d2a7eac64846a2d9243c697"`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ADD CONSTRAINT "FK_4d57d2a7eac64846a2d9243c697" FOREIGN KEY ("articleTitleImageId") REFERENCES "article"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
