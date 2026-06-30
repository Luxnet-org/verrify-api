import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPendingReverificationStatus1781000000005
  implements MigrationInterface
{
  name = 'AddPendingReverificationStatus1781000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_property_active_verification_version"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property_verification_version" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."property_propertyverificationstatus_enum" RENAME TO "property_propertyverificationstatus_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."property_propertyverificationstatus_enum" AS ENUM('NOT_VERIFIED', 'PENDING', 'PENDING_REVERIFICATION', 'IN_REVIEW', 'VERIFIED', 'REJECTED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "property" ALTER COLUMN "propertyVerificationStatus" TYPE "public"."property_propertyverificationstatus_enum" USING "propertyVerificationStatus"::text::"public"."property_propertyverificationstatus_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property_verification_version" ALTER COLUMN "status" TYPE "public"."property_propertyverificationstatus_enum" USING "status"::text::"public"."property_propertyverificationstatus_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property_verification_version" ALTER COLUMN "status" SET DEFAULT 'PENDING'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."property_propertyverificationstatus_enum_old"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_property_active_verification_version" ON "property_verification_version" ("propertyId") WHERE "status" IN ('PENDING', 'PENDING_REVERIFICATION', 'IN_REVIEW')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "property" SET "propertyVerificationStatus" = 'PENDING' WHERE "propertyVerificationStatus" = 'PENDING_REVERIFICATION'`,
    );
    await queryRunner.query(
      `UPDATE "property_verification_version" SET "status" = 'PENDING' WHERE "status" = 'PENDING_REVERIFICATION'`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_property_active_verification_version"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."property_propertyverificationstatus_enum" RENAME TO "property_propertyverificationstatus_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."property_propertyverificationstatus_enum" AS ENUM('NOT_VERIFIED', 'PENDING', 'IN_REVIEW', 'VERIFIED', 'REJECTED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "property_verification_version" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "property" ALTER COLUMN "propertyVerificationStatus" TYPE "public"."property_propertyverificationstatus_enum" USING "propertyVerificationStatus"::text::"public"."property_propertyverificationstatus_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property_verification_version" ALTER COLUMN "status" TYPE "public"."property_propertyverificationstatus_enum" USING "status"::text::"public"."property_propertyverificationstatus_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property_verification_version" ALTER COLUMN "status" SET DEFAULT 'PENDING'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."property_propertyverificationstatus_enum_old"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_property_active_verification_version" ON "property_verification_version" ("propertyId") WHERE "status" IN ('PENDING', 'IN_REVIEW')`,
    );
  }
}
