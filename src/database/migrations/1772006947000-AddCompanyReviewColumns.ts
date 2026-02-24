import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompanyReviewColumns1772006947000
    implements MigrationInterface {
    name = 'AddCompanyReviewColumns1772006947000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add missing columns to "company" table
        await queryRunner.query(
            `ALTER TABLE "company" ADD "reviewedAt" TIMESTAMP WITH TIME ZONE`,
        );
        await queryRunner.query(
            `ALTER TABLE "company" ADD "verifiedAt" TIMESTAMP WITH TIME ZONE`,
        );
        await queryRunner.query(
            `ALTER TABLE "company" ADD "reviewUserId" uuid`,
        );
        await queryRunner.query(
            `ALTER TABLE "company" ADD CONSTRAINT "FK_company_reviewUser" FOREIGN KEY ("reviewUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );

        // Add missing columns to "property" table
        await queryRunner.query(
            `ALTER TABLE "property" ADD IF NOT EXISTS "pin" character varying`,
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_property_pin" ON "property" ("pin") WHERE "pin" IS NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "property" ADD "reviewedAt" TIMESTAMP WITH TIME ZONE`,
        );
        await queryRunner.query(
            `ALTER TABLE "property" ADD "verifiedAt" TIMESTAMP WITH TIME ZONE`,
        );
        await queryRunner.query(
            `ALTER TABLE "property" ADD "reviewUserId" uuid`,
        );
        await queryRunner.query(
            `ALTER TABLE "property" ADD CONSTRAINT "FK_property_reviewUser" FOREIGN KEY ("reviewUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert property changes
        await queryRunner.query(
            `ALTER TABLE "property" DROP CONSTRAINT "FK_property_reviewUser"`,
        );
        await queryRunner.query(
            `ALTER TABLE "property" DROP COLUMN "reviewUserId"`,
        );
        await queryRunner.query(
            `ALTER TABLE "property" DROP COLUMN "verifiedAt"`,
        );
        await queryRunner.query(
            `ALTER TABLE "property" DROP COLUMN "reviewedAt"`,
        );
        await queryRunner.query(
            `DROP INDEX IF EXISTS "IDX_property_pin"`,
        );
        await queryRunner.query(
            `ALTER TABLE "property" DROP COLUMN IF EXISTS "pin"`,
        );

        // Revert company changes
        await queryRunner.query(
            `ALTER TABLE "company" DROP CONSTRAINT "FK_company_reviewUser"`,
        );
        await queryRunner.query(
            `ALTER TABLE "company" DROP COLUMN "reviewUserId"`,
        );
        await queryRunner.query(
            `ALTER TABLE "company" DROP COLUMN "verifiedAt"`,
        );
        await queryRunner.query(
            `ALTER TABLE "company" DROP COLUMN "reviewedAt"`,
        );
    }
}
