import { MigrationInterface, QueryRunner } from 'typeorm';

export class ContactmeArticleFeatureMigration41759579762404
  implements MigrationInterface
{
  name = 'ContactmeArticleFeatureMigration41759579762404';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."location_locationPolygon_idx"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."article_articlestatus_enum" AS ENUM('DRAFT', 'PUBLISHED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "article" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "title" character varying NOT NULL, "description" text NOT NULL, "slug" character varying NOT NULL, "content" jsonb NOT NULL, "publishedAt" TIMESTAMP WITH TIME ZONE, "articleStatus" "public"."article_articlestatus_enum" NOT NULL, "featuredFlag" boolean NOT NULL DEFAULT false, "createdUserId" uuid, CONSTRAINT "UQ_0ab85f4be07b22d79906671d72f" UNIQUE ("slug"), CONSTRAINT "REL_f9abd67735499ed02df43f30f1" UNIQUE ("createdUserId"), CONSTRAINT "PK_40808690eb7b915046558c0f81b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ADD "articleTitleImageId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ADD CONSTRAINT "UQ_4d57d2a7eac64846a2d9243c697" UNIQUE ("articleTitleImageId")`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."file_filetype_enum" RENAME TO "file_filetype_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."file_filetype_enum" AS ENUM('PROFILE_PICTURE', 'PROOF_OF_ADDRESS', 'COMPANY_PROFILE_PICTURE', 'CERTIFICATE_OF_OCCUPANCY', 'CONTRACT_OF_SALE', 'SURVEY_PLAN', 'LETTER_OF_INTENT', 'DEED_OF_CONVEYANCE', 'ARTICLE_TITLE_IMAGE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ALTER COLUMN "fileType" TYPE "public"."file_filetype_enum" USING "fileType"::"text"::"public"."file_filetype_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."file_filetype_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "article" ADD CONSTRAINT "FK_f9abd67735499ed02df43f30f15" FOREIGN KEY ("createdUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ADD CONSTRAINT "FK_4d57d2a7eac64846a2d9243c697" FOREIGN KEY ("articleTitleImageId") REFERENCES "article"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "file" DROP CONSTRAINT "FK_4d57d2a7eac64846a2d9243c697"`,
    );
    await queryRunner.query(
      `ALTER TABLE "article" DROP CONSTRAINT "FK_f9abd67735499ed02df43f30f15"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."file_filetype_enum_old" AS ENUM('PROFILE_PICTURE', 'PROOF_OF_ADDRESS', 'COMPANY_PROFILE_PICTURE', 'CERTIFICATE_OF_OCCUPANCY', 'CONTRACT_OF_SALE', 'SURVEY_PLAN', 'LETTER_OF_INTENT', 'DEED_OF_CONVEYANCE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ALTER COLUMN "fileType" TYPE "public"."file_filetype_enum_old" USING "fileType"::"text"::"public"."file_filetype_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."file_filetype_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."file_filetype_enum_old" RENAME TO "file_filetype_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" DROP CONSTRAINT "UQ_4d57d2a7eac64846a2d9243c697"`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" DROP COLUMN "articleTitleImageId"`,
    );
    await queryRunner.query(`DROP TABLE "article"`);
    await queryRunner.query(`DROP TYPE "public"."article_articlestatus_enum"`);
    await queryRunner.query(
      `CREATE INDEX "location_locationPolygon_idx" ON "location" USING GiST ("locationPolygon") `,
    );
  }
}
