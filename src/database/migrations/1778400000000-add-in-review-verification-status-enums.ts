import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInReviewToVerificationStatusEnums1778400000000 implements MigrationInterface {
    name = 'AddInReviewToVerificationStatusEnums1778400000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."company_companyverificationstatus_enum" ADD VALUE IF NOT EXISTS 'IN_REVIEW'`);
        await queryRunner.query(`ALTER TYPE "public"."property_propertyverificationstatus_enum" ADD VALUE IF NOT EXISTS 'IN_REVIEW'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // PostgreSQL does not support removing values from an enum type.
    }

}
