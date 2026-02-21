import { MigrationInterface, QueryRunner } from "typeorm";

export class GeneratePinsForVerifiedProperties1771619100000 implements MigrationInterface {
    name = 'GeneratePinsForVerifiedProperties1771619100000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Find all verified properties (and sub-properties) that have no PIN
        const properties = await queryRunner.query(`
            SELECT p."id", l."state"
            FROM "property" p
            LEFT JOIN "location_entity" l ON l."propertyId" = p."id"
            WHERE p."propertyVerificationStatus" = 'VERIFIED'
              AND (p."pin" IS NULL OR p."pin" = '')
        `);

        if (properties.length === 0) {
            return;
        }

        const year = new Date().getFullYear().toString().substring(2);
        const usedPins = new Set<string>();

        // Also load existing PINs to avoid collisions
        const existingPins = await queryRunner.query(
            `SELECT "pin" FROM "property" WHERE "pin" IS NOT NULL`
        );
        for (const row of existingPins) {
            usedPins.add(row.pin);
        }

        for (const prop of properties) {
            const statePrefix = prop.state
                ? prop.state.substring(0, 2).toUpperCase()
                : 'XX';

            let pin: string;
            do {
                const randomDigits = Math.floor(1000 + Math.random() * 9000).toString();
                pin = `VP-${statePrefix}-${year}-${randomDigits}`;
            } while (usedPins.has(pin));

            usedPins.add(pin);

            await queryRunner.query(
                `UPDATE "property" SET "pin" = $1 WHERE "id" = $2`,
                [pin, prop.id]
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // This migration only backfills data; reverting would remove PINs
        // that were generated. We don't revert to avoid data loss.
    }
}
