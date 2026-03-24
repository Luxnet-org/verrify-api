import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVerificationDocumentFiletypeMigration61774573334000
  implements MigrationInterface
{
  name = 'AddVerificationDocumentFiletypeMigration61774573334000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."file_filetype_enum" RENAME TO "file_filetype_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."file_filetype_enum" AS ENUM('PROFILE_PICTURE', 'PROOF_OF_ADDRESS', 'COMPANY_PROFILE_PICTURE', 'CERTIFICATE_OF_OCCUPANCY', 'CONTRACT_OF_SALE', 'SURVEY_PLAN', 'LETTER_OF_INTENT', 'DEED_OF_CONVEYANCE', 'ARTICLE_TITLE_IMAGE', 'VERIFICATION_DOCUMENT', 'ADMIN_STAGE_DOCUMENT')`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ALTER COLUMN "fileType" TYPE "public"."file_filetype_enum" USING "fileType"::"text"::"public"."file_filetype_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."file_filetype_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."file_filetype_enum_old" AS ENUM('PROFILE_PICTURE', 'PROOF_OF_ADDRESS', 'COMPANY_PROFILE_PICTURE', 'CERTIFICATE_OF_OCCUPANCY', 'CONTRACT_OF_SALE', 'SURVEY_PLAN', 'LETTER_OF_INTENT', 'DEED_OF_CONVEYANCE', 'ARTICLE_TITLE_IMAGE')`,
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
