import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuthorizationUrlToTransactionMigration51710795029000
  implements MigrationInterface
{
  name = 'AddAuthorizationUrlToTransactionMigration51710795029000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "authorizationUrl" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "authorizationUrl"`,
    );
  }
}
