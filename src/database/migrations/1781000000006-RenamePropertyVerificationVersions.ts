import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenamePropertyVerificationVersions1781000000006
  implements MigrationInterface
{
  name = 'RenamePropertyVerificationVersions1781000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "property_verification_version" RENAME TO "property_version"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property_verification_version_other_document" RENAME TO "property_version_other_document"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property_verification_version_user" RENAME TO "property_version_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property" RENAME COLUMN "currentVerificationVersionId" TO "currentVersionId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property_version" RENAME CONSTRAINT "PK_property_verification_version" TO "PK_property_version"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property_version" RENAME CONSTRAINT "FK_property_verification_version_property" TO "FK_property_version_property"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property_version_other_document" RENAME CONSTRAINT "PK_property_verification_version_other_document" TO "PK_property_version_other_document"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property_version_other_document" RENAME CONSTRAINT "FK_version_other_document_version" TO "FK_property_version_other_document_version"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property_version_other_document" RENAME CONSTRAINT "FK_version_other_document_file" TO "FK_property_version_other_document_file"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property_version_user" RENAME CONSTRAINT "PK_property_verification_version_user" TO "PK_property_version_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property_version_user" RENAME CONSTRAINT "FK_property_verification_version_user_version" TO "FK_property_version_user_version"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property_version_user" RENAME CONSTRAINT "FK_property_verification_version_user_user" TO "FK_property_version_user_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property" RENAME CONSTRAINT "FK_property_current_verification_version" TO "FK_property_current_version"`,
    );
    await queryRunner.query(
      `ALTER INDEX "IDX_property_active_verification_version" RENAME TO "IDX_property_active_version"`,
    );
    await queryRunner.query(
      `ALTER INDEX "IDX_version_other_document_label" RENAME TO "IDX_property_version_other_document_label"`,
    );
    await queryRunner.query(
      `ALTER INDEX "IDX_property_verification_version_user_version" RENAME TO "IDX_property_version_user_version"`,
    );
    await queryRunner.query(
      `ALTER INDEX "IDX_property_verification_version_user_user" RENAME TO "IDX_property_version_user_user"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER INDEX "IDX_property_version_user_user" RENAME TO "IDX_property_verification_version_user_user"`,
    );
    await queryRunner.query(
      `ALTER INDEX "IDX_property_version_user_version" RENAME TO "IDX_property_verification_version_user_version"`,
    );
    await queryRunner.query(
      `ALTER INDEX "IDX_property_version_other_document_label" RENAME TO "IDX_version_other_document_label"`,
    );
    await queryRunner.query(
      `ALTER INDEX "IDX_property_active_version" RENAME TO "IDX_property_active_verification_version"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property" RENAME CONSTRAINT "FK_property_current_version" TO "FK_property_current_verification_version"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property_version_user" RENAME CONSTRAINT "FK_property_version_user_user" TO "FK_property_verification_version_user_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property_version_user" RENAME CONSTRAINT "FK_property_version_user_version" TO "FK_property_verification_version_user_version"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property_version_user" RENAME CONSTRAINT "PK_property_version_user" TO "PK_property_verification_version_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property_version_other_document" RENAME CONSTRAINT "FK_property_version_other_document_file" TO "FK_version_other_document_file"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property_version_other_document" RENAME CONSTRAINT "FK_property_version_other_document_version" TO "FK_version_other_document_version"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property_version_other_document" RENAME CONSTRAINT "PK_property_version_other_document" TO "PK_property_verification_version_other_document"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property_version" RENAME CONSTRAINT "FK_property_version_property" TO "FK_property_verification_version_property"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property_version" RENAME CONSTRAINT "PK_property_version" TO "PK_property_verification_version"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property" RENAME COLUMN "currentVersionId" TO "currentVerificationVersionId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property_version_user" RENAME TO "property_verification_version_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property_version_other_document" RENAME TO "property_verification_version_other_document"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property_version" RENAME TO "property_verification_version"`,
    );
  }
}
