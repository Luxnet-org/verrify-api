import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedInitialData1781000000001 implements MigrationInterface {
  name = 'SeedInitialData1781000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "verification_package" ("name", "description", "price", "isActive", "sortOrder") VALUES
      ('Basic Verification', 'Survey inspection and title document verification. Confirms property boundaries, validates ownership documentation, and provides a summary verification certificate.', 150000, true, 1),
      ('Standard Verification', 'Title verification with registry search and encumbrance checks. Includes boundary survey, ownership validation, lien and debt clearance confirmation, and a detailed status report.', 350000, true, 2),
      ('Premium Verification', 'Full due diligence with legal review and comprehensive report. Covers survey inspection, title search, encumbrance checks, regulatory compliance audit, risk assessment, and a certified verification report.', 750000, true, 3)
    `);

    await queryRunner.query(
      `INSERT INTO "users" ("firstName", "lastName", "role", "username", "email", "passwordHash", "isAgreed", "isVerified", "isEnabled") VALUES ($1, $2, $3, $4, $5, $6, true, true, true), ($7, $8, $9, $10, $11, $12, true, true, true)`,
      [
        'verrify',
        'verrify',
        'SUPER_ADMIN',
        'verrify',
        'luxnetltd@gmail.com',
        '$2b$10$c/YM8eKWeWV3eRtKscekIOTEcPjBOwK5V0sbM/rk6pNeKQgCyVoiq',
        'Reuben',
        'Alabi',
        'USER',
        'ruby',
        'rubydevwork@gmial.com',
        '$2b$10$nuV0s7duCtn9hvPlH4sXReIAxD/QzWMat4blj0F9l7ownx1tjYQqi',
      ],
    );

    await queryRunner.query(`
      INSERT INTO "location" ("userId")
      SELECT "id" FROM "users"
      WHERE "email" IN ('luxnetltd@gmail.com', 'rubydevwork@gmial.com')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "location"
      WHERE "userId" IN (
        SELECT "id" FROM "users"
        WHERE "email" IN ('luxnetltd@gmail.com', 'rubydevwork@gmial.com')
      )
    `);
    await queryRunner.query(
      `DELETE FROM "users" WHERE "email" IN ('luxnetltd@gmail.com', 'rubydevwork@gmial.com')`,
    );
    await queryRunner.query(
      `DELETE FROM "verification_package" WHERE "sortOrder" IN (1, 2, 3)`,
    );
  }
}
