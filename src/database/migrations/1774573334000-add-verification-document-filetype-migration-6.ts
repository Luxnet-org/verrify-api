import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVerificationDocumentFiletypeMigration61774573334000
  implements MigrationInterface
{
  name = 'AddVerificationDocumentFiletypeMigration61774573334000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."file_filetype_enum" ADD VALUE IF NOT EXISTS 'VERIFICATION_DOCUMENT'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."file_filetype_enum" ADD VALUE IF NOT EXISTS 'ADMIN_STAGE_DOCUMENT'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL does not support removing values from an enum type.
  }
}
