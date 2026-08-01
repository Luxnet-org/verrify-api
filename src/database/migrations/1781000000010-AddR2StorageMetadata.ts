import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddR2StorageMetadata1781000000010 implements MigrationInterface {
  name = 'AddR2StorageMetadata1781000000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."file_storageprovider_enum" AS ENUM('CLOUDINARY', 'CLOUDFLARE_R2')`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ADD "storageProvider" "public"."file_storageprovider_enum" NOT NULL DEFAULT 'CLOUDINARY'`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ADD "bucket" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ADD "objectKey" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ADD "originalFileName" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ADD "mimeType" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "file" ADD "size" integer`);
    await queryRunner.query(
      `ALTER TABLE "file" ALTER COLUMN "url" DROP NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_file_r2_bucket_object_key" ON "file" ("bucket", "objectKey") WHERE "bucket" IS NOT NULL AND "objectKey" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_file_r2_bucket_object_key"`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ALTER COLUMN "url" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "size"`);
    await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "mimeType"`);
    await queryRunner.query(
      `ALTER TABLE "file" DROP COLUMN "originalFileName"`,
    );
    await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "objectKey"`);
    await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "bucket"`);
    await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "storageProvider"`);
    await queryRunner.query(`DROP TYPE "public"."file_storageprovider_enum"`);
  }
}
