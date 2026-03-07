import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInReviewToVerificationStageEnum1778396496000 implements MigrationInterface {
    name = 'AddInReviewToVerificationStageEnum1778396496000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."property_verification_stage_enum" ADD VALUE IF NOT EXISTS 'IN_REVIEW'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // PostgreSQL does not support removing values from an enum type.
        // To fully revert, you would need to recreate the enum without 'IN_REVIEW'.
    }

}
