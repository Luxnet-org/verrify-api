import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVerificationPackages1781000000000 implements MigrationInterface {
    name = 'AddVerificationPackages1781000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create verification_package table
        await queryRunner.query(`
            CREATE TABLE "verification_package" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deletedAt" TIMESTAMP WITH TIME ZONE,
                "name" character varying NOT NULL,
                "description" text NOT NULL,
                "price" numeric(10,2) NOT NULL,
                "isActive" boolean NOT NULL DEFAULT true,
                "sortOrder" integer NOT NULL DEFAULT 0,
                CONSTRAINT "PK_verification_package" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_verification_package_sortOrder" UNIQUE ("sortOrder")
            )
        `);

        // Add verificationPackageId FK to order
        await queryRunner.query(`ALTER TABLE "order" ADD "verificationPackageId" uuid`);
        await queryRunner.query(`ALTER TABLE "order" ADD CONSTRAINT "FK_order_verificationPackage" FOREIGN KEY ("verificationPackageId") REFERENCES "verification_package"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        // Add verificationPackageId FK to property_verification
        await queryRunner.query(`ALTER TABLE "property_verification" ADD "verificationPackageId" uuid`);
        await queryRunner.query(`ALTER TABLE "property_verification" ADD CONSTRAINT "FK_property_verification_verificationPackage" FOREIGN KEY ("verificationPackageId") REFERENCES "verification_package"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        // Seed default packages
        await queryRunner.query(`
            INSERT INTO "verification_package" ("name", "description", "price", "isActive", "sortOrder") VALUES
            ('Basic Verification', 'Survey inspection and title document verification. Confirms property boundaries, validates ownership documentation, and provides a summary verification certificate.', 150000, true, 1),
            ('Standard Verification', 'Title verification with registry search and encumbrance checks. Includes boundary survey, ownership validation, lien and debt clearance confirmation, and a detailed status report.', 350000, true, 2),
            ('Premium Verification', 'Full due diligence with legal review and comprehensive report. Covers survey inspection, title search, encumbrance checks, regulatory compliance audit, risk assessment, and a certified verification report.', 750000, true, 3)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "property_verification" DROP CONSTRAINT "FK_property_verification_verificationPackage"`);
        await queryRunner.query(`ALTER TABLE "property_verification" DROP COLUMN "verificationPackageId"`);
        await queryRunner.query(`ALTER TABLE "order" DROP CONSTRAINT "FK_order_verificationPackage"`);
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "verificationPackageId"`);
        await queryRunner.query(`DROP TABLE "verification_package"`);
    }
}
