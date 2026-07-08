import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOtherFileType1781000000007 implements MigrationInterface {
  name = 'AddOtherFileType1781000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."file_filetype_enum_new" AS ENUM('PROFILE_PICTURE', 'PROOF_OF_ADDRESS', 'COMPANY_PROFILE_PICTURE', 'CERTIFICATE_OF_OCCUPANCY', 'CONTRACT_OF_SALE', 'SURVEY_PLAN', 'LETTER_OF_INTENT', 'DEED_OF_CONVEYANCE', 'ARTICLE_TITLE_IMAGE', 'VERIFICATION_DOCUMENT', 'ADMIN_STAGE_DOCUMENT', 'PROPERTY_OTHER_DOCUMENT', 'OTHER')`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ALTER COLUMN "fileType" TYPE "public"."file_filetype_enum_new" USING "fileType"::"text"::"public"."file_filetype_enum_new"`,
    );
    await queryRunner.query(`DROP TYPE "public"."file_filetype_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."file_filetype_enum_new" RENAME TO "file_filetype_enum"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "file" WHERE "fileType" = 'OTHER'`);
    await queryRunner.query(
      `CREATE TYPE "public"."file_filetype_enum_old" AS ENUM('PROFILE_PICTURE', 'PROOF_OF_ADDRESS', 'COMPANY_PROFILE_PICTURE', 'CERTIFICATE_OF_OCCUPANCY', 'CONTRACT_OF_SALE', 'SURVEY_PLAN', 'LETTER_OF_INTENT', 'DEED_OF_CONVEYANCE', 'ARTICLE_TITLE_IMAGE', 'VERIFICATION_DOCUMENT', 'ADMIN_STAGE_DOCUMENT', 'PROPERTY_OTHER_DOCUMENT')`,
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
