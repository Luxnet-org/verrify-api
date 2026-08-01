import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAsyncPaymentWebhooks1781000000011
  implements MigrationInterface
{
  name = 'AddAsyncPaymentWebhooks1781000000011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "verification_package" ALTER COLUMN "price" TYPE bigint USING ROUND("price" * 100)::bigint`,
    );
    await queryRunner.query(
      `ALTER TABLE "order" ALTER COLUMN "amount" TYPE bigint USING ROUND("amount" * 100)::bigint`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ALTER COLUMN "amount" TYPE bigint USING ROUND("amount" * 100)::bigint`,
    );

    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "currency" character varying(3)`,
    );
    await queryRunner.query(
      `UPDATE "transaction" AS tx SET "currency" = COALESCE(ord."currency", 'NGN') FROM "order" AS ord WHERE tx."orderId" = ord."id"`,
    );
    await queryRunner.query(
      `UPDATE "transaction" SET "currency" = 'NGN' WHERE "currency" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ALTER COLUMN "currency" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ALTER COLUMN "currency" SET DEFAULT 'NGN'`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."transaction_paymentcategory_enum" AS ENUM('PROPERTY_VERIFICATION', 'SUBSCRIPTION')`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "paymentCategory" "public"."transaction_paymentcategory_enum" NOT NULL DEFAULT 'PROPERTY_VERIFICATION'`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "providerTransactionId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "failureReason" text`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."webhook_event_provider_enum" AS ENUM('PAYSTACK')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."webhook_event_status_enum" AS ENUM('RECEIVED', 'PROCESSED', 'IGNORED', 'FAILED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "webhook_event" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "provider" "public"."webhook_event_provider_enum" NOT NULL, "providerEventId" character varying(255) NOT NULL, "eventType" character varying(100) NOT NULL, "status" "public"."webhook_event_status_enum" NOT NULL DEFAULT 'RECEIVED', "payload" jsonb NOT NULL, "rawBody" text NOT NULL, "signature" character varying(128) NOT NULL, "sourceIp" character varying(64) NOT NULL, "deliveryCount" integer NOT NULL DEFAULT 1, "attemptCount" integer NOT NULL DEFAULT 0, "lastError" text, "statusReason" text, "processedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_webhook_event" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_webhook_event_provider_event_id" ON "webhook_event" ("providerEventId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_webhook_event_provider_event_id"`,
    );
    await queryRunner.query(`DROP TABLE "webhook_event"`);
    await queryRunner.query(`DROP TYPE "public"."webhook_event_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."webhook_event_provider_enum"`);

    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "failureReason"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "providerTransactionId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "paymentCategory"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."transaction_paymentcategory_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "currency"`);

    await queryRunner.query(
      `ALTER TABLE "transaction" ALTER COLUMN "amount" TYPE numeric(10,2) USING ("amount"::numeric / 100)::numeric(10,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "order" ALTER COLUMN "amount" TYPE numeric(10,2) USING ("amount"::numeric / 100)::numeric(10,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "verification_package" ALTER COLUMN "price" TYPE numeric(10,2) USING ("price"::numeric / 100)::numeric(10,2)`,
    );
  }
}
