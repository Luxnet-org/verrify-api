import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStageHistoryColumn1772007000000
    implements MigrationInterface {
    name = 'AddStageHistoryColumn1772007000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add stageHistory column with default empty array
        await queryRunner.query(
            `ALTER TABLE "property_verification" ADD "stageHistory" text NOT NULL DEFAULT '[]'`,
        );

        // Backfill existing rows: set stageHistory to contain their current stage with updatedAt as timestamp
        await queryRunner.query(
            `UPDATE "property_verification" SET "stageHistory" = '[{"stage":"' || "stage" || '","completedAt":"' || "updatedAt" || '"}]'`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "property_verification" DROP COLUMN "stageHistory"`,
        );
    }
}
