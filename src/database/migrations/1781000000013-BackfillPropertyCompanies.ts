import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillPropertyCompanies1781000000013
  implements MigrationInterface
{
  name = 'BackfillPropertyCompanies1781000000013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "property" AS "subProperty"
      SET "companyId" = "parentProperty"."companyId"
      FROM "property" AS "parentProperty"
      WHERE "subProperty"."parentPropertyId" = "parentProperty"."id"
        AND "subProperty"."isSubProperty" = true
        AND "subProperty"."companyId" IS NULL
        AND "parentProperty"."companyId" IS NOT NULL
        AND "subProperty"."deletedAt" IS NULL
        AND "parentProperty"."deletedAt" IS NULL
    `);
  }

  public async down(): Promise<void> {
    // This data repair is intentionally irreversible because clearing company
    // links could remove associations created after this migration ran.
  }
}
