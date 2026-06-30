import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPropertyVerificationVersionUsers1781000000004
  implements MigrationInterface
{
  name = 'AddPropertyVerificationVersionUsers1781000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "property_verification_version_user" ("versionId" uuid NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "PK_property_verification_version_user" PRIMARY KEY ("versionId", "userId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_property_verification_version_user_version" ON "property_verification_version_user" ("versionId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_property_verification_version_user_user" ON "property_verification_version_user" ("userId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "property_verification_version_user" ADD CONSTRAINT "FK_property_verification_version_user_version" FOREIGN KEY ("versionId") REFERENCES "property_verification_version"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "property_verification_version_user" ADD CONSTRAINT "FK_property_verification_version_user_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `INSERT INTO "property_verification_version_user" ("versionId", "userId")
       SELECT "version"."id", "assignment"."userId"
       FROM "property_verification_version" "version"
       INNER JOIN "property" "property" ON "property"."id" = "version"."propertyId"
       INNER JOIN "user_property" "assignment" ON "assignment"."propertyId" = "property"."id"
       WHERE "property"."isSubProperty" = true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "property_verification_version_user" DROP CONSTRAINT "FK_property_verification_version_user_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property_verification_version_user" DROP CONSTRAINT "FK_property_verification_version_user_version"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_property_verification_version_user_user"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_property_verification_version_user_version"`,
    );
    await queryRunner.query(`DROP TABLE "property_verification_version_user"`);
  }
}
