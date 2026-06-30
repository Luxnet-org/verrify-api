import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPropertyOtherDocuments1781000000002
  implements MigrationInterface
{
  name = 'AddPropertyOtherDocuments1781000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."file_filetype_enum_new" AS ENUM('PROFILE_PICTURE', 'PROOF_OF_ADDRESS', 'COMPANY_PROFILE_PICTURE', 'CERTIFICATE_OF_OCCUPANCY', 'CONTRACT_OF_SALE', 'SURVEY_PLAN', 'LETTER_OF_INTENT', 'DEED_OF_CONVEYANCE', 'ARTICLE_TITLE_IMAGE', 'VERIFICATION_DOCUMENT', 'ADMIN_STAGE_DOCUMENT', 'PROPERTY_OTHER_DOCUMENT')`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ALTER COLUMN "fileType" TYPE "public"."file_filetype_enum_new" USING "fileType"::"text"::"public"."file_filetype_enum_new"`,
    );
    await queryRunner.query(`DROP TYPE "public"."file_filetype_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."file_filetype_enum_new" RENAME TO "file_filetype_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ADD "otherDocumentPropertyId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ADD "otherDocumentLabel" character varying`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_file_other_document_property_label" ON "file" ("otherDocumentPropertyId", "otherDocumentLabel") WHERE "otherDocumentPropertyId" IS NOT NULL AND "otherDocumentLabel" IS NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ADD CONSTRAINT "FK_file_other_document_property" FOREIGN KEY ("otherDocumentPropertyId") REFERENCES "property"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "file" DROP CONSTRAINT "FK_file_other_document_property"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_file_other_document_property_label"`,
    );
    await queryRunner.query(
      `DELETE FROM "file" WHERE "fileType" = 'PROPERTY_OTHER_DOCUMENT'`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" DROP COLUMN "otherDocumentLabel"`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" DROP COLUMN "otherDocumentPropertyId"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."file_filetype_enum_old" AS ENUM('PROFILE_PICTURE', 'PROOF_OF_ADDRESS', 'COMPANY_PROFILE_PICTURE', 'CERTIFICATE_OF_OCCUPANCY', 'CONTRACT_OF_SALE', 'SURVEY_PLAN', 'LETTER_OF_INTENT', 'DEED_OF_CONVEYANCE', 'ARTICLE_TITLE_IMAGE', 'VERIFICATION_DOCUMENT', 'ADMIN_STAGE_DOCUMENT')`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ALTER COLUMN "fileType" TYPE "public"."file_filetype_enum_old" USING "fileType"::"text"::"public"."file_filetype_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."file_filetype_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."file_filetype_enum_old" RENAME TO "file_filetype_enum"`,
    );
  }
}
