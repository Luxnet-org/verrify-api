import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaymentInitializationIdempotency1781000000012
  implements MigrationInterface
{
  name = 'AddPaymentInitializationIdempotency1781000000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "accessCode" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "idempotencyKey" text`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_transaction_idempotency_key" ON "transaction" ("idempotencyKey") WHERE "idempotencyKey" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_transaction_idempotency_key"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "idempotencyKey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "accessCode"`,
    );
  }
}
