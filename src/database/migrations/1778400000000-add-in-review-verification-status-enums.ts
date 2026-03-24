import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInReviewToVerificationStatusEnums1778400000000 implements MigrationInterface {
    name = 'AddInReviewToVerificationStatusEnums1778400000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Company Verification Status
        await queryRunner.query(`ALTER TYPE "public"."company_companyverificationstatus_enum" RENAME TO "company_companyverificationstatus_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."company_companyverificationstatus_enum" AS ENUM('NOT_VERIFIED', 'PENDING', 'IN_REVIEW', 'VERIFIED', 'REJECTED')`);
        await queryRunner.query(`ALTER TABLE "company" ALTER COLUMN "companyVerificationStatus" TYPE "public"."company_companyverificationstatus_enum" USING "companyVerificationStatus"::"text"::"public"."company_companyverificationstatus_enum"`);
        await queryRunner.query(`DROP TYPE "public"."company_companyverificationstatus_enum_old"`);

        // Property Verification Status
        await queryRunner.query(`ALTER TYPE "public"."property_propertyverificationstatus_enum" RENAME TO "property_propertyverificationstatus_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."property_propertyverificationstatus_enum" AS ENUM('NOT_VERIFIED', 'PENDING', 'IN_REVIEW', 'VERIFIED', 'REJECTED')`);
        await queryRunner.query(`ALTER TABLE "property" ALTER COLUMN "propertyVerificationStatus" TYPE "public"."property_propertyverificationstatus_enum" USING "propertyVerificationStatus"::"text"::"public"."property_propertyverificationstatus_enum"`);
        await queryRunner.query(`DROP TYPE "public"."property_propertyverificationstatus_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Reverse Property Verification Status
        await queryRunner.query(`CREATE TYPE "public"."property_propertyverificationstatus_enum_old" AS ENUM('NOT_VERIFIED', 'PENDING', 'VERIFIED', 'REJECTED')`);
        await queryRunner.query(`ALTER TABLE "property" ALTER COLUMN "propertyVerificationStatus" TYPE "public"."property_propertyverificationstatus_enum_old" USING "propertyVerificationStatus"::"text"::"public"."property_propertyverificationstatus_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."property_propertyverificationstatus_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."property_propertyverificationstatus_enum_old" RENAME TO "property_propertyverificationstatus_enum"`);

        // Reverse Company Verification Status
        await queryRunner.query(`CREATE TYPE "public"."company_companyverificationstatus_enum_old" AS ENUM('NOT_VERIFIED', 'PENDING', 'VERIFIED', 'REJECTED')`);
        await queryRunner.query(`ALTER TABLE "company" ALTER COLUMN "companyVerificationStatus" TYPE "public"."company_companyverificationstatus_enum_old" USING "companyVerificationStatus"::"text"::"public"."company_companyverificationstatus_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."company_companyverificationstatus_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."company_companyverificationstatus_enum_old" RENAME TO "company_companyverificationstatus_enum"`);
    }

}
