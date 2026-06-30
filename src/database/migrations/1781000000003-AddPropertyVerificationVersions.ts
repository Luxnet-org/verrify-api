import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPropertyVerificationVersions1781000000003
  implements MigrationInterface
{
  name = 'AddPropertyVerificationVersions1781000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "property_verification_version" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "status" "public"."property_propertyverificationstatus_enum" NOT NULL DEFAULT 'PENDING', "propertyType" "public"."property_propertytype_enum" NOT NULL, "address" character varying, "city" character varying, "state" character varying, "locationPolygon" geometry(Polygon,4326), "area" double precision, "adminComments" text, "statusHistory" text NOT NULL DEFAULT '[]', "propertyId" uuid, "certificationOfOccupancyId" uuid, "contractOfSaleId" uuid, "surveyPlanId" uuid, "letterOfIntentId" uuid, "deedOfConveyanceId" uuid, CONSTRAINT "PK_property_verification_version" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "property_verification_version_other_document" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "label" character varying NOT NULL, "versionId" uuid, "fileId" uuid, CONSTRAINT "PK_property_verification_version_other_document" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_property_active_verification_version" ON "property_verification_version" ("propertyId") WHERE "status" IN ('PENDING', 'IN_REVIEW')`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_version_other_document_label" ON "property_verification_version_other_document" ("versionId", "label")`,
    );

    await queryRunner.query(
      `ALTER TABLE "property_verification_version" ADD CONSTRAINT "FK_property_verification_version_property" FOREIGN KEY ("propertyId") REFERENCES "property"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "property_verification_version" ADD CONSTRAINT "FK_property_version_certification_of_occupancy" FOREIGN KEY ("certificationOfOccupancyId") REFERENCES "file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "property_verification_version" ADD CONSTRAINT "FK_property_version_contract_of_sale" FOREIGN KEY ("contractOfSaleId") REFERENCES "file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "property_verification_version" ADD CONSTRAINT "FK_property_version_survey_plan" FOREIGN KEY ("surveyPlanId") REFERENCES "file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "property_verification_version" ADD CONSTRAINT "FK_property_version_letter_of_intent" FOREIGN KEY ("letterOfIntentId") REFERENCES "file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "property_verification_version" ADD CONSTRAINT "FK_property_version_deed_of_conveyance" FOREIGN KEY ("deedOfConveyanceId") REFERENCES "file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "property_verification_version_other_document" ADD CONSTRAINT "FK_version_other_document_version" FOREIGN KEY ("versionId") REFERENCES "property_verification_version"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "property_verification_version_other_document" ADD CONSTRAINT "FK_version_other_document_file" FOREIGN KEY ("fileId") REFERENCES "file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "property" ADD "currentVerificationVersionId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "property" ADD CONSTRAINT "FK_property_current_verification_version" FOREIGN KEY ("currentVerificationVersionId") REFERENCES "property_verification_version"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `INSERT INTO "property_verification_version" ("id", "createdAt", "updatedAt", "status", "propertyType", "address", "city", "state", "locationPolygon", "area", "statusHistory", "propertyId", "certificationOfOccupancyId", "contractOfSaleId", "surveyPlanId", "letterOfIntentId", "deedOfConveyanceId")
       SELECT uuid_generate_v4(), now(), now(), "property"."propertyVerificationStatus", "property"."propertyType", "location"."address", "location"."city", "location"."state", "location"."locationPolygon", "property"."area", '[]', "property"."id", "coc"."id", "cos"."id", "sp"."id", "loi"."id", "doc"."id"
       FROM "property"
       LEFT JOIN "location" ON "location"."propertyId" = "property"."id"
       LEFT JOIN "file" "coc" ON "coc"."certificationOfOccupancyId" = "property"."id"
       LEFT JOIN "file" "cos" ON "cos"."contractOfSaleId" = "property"."id"
       LEFT JOIN "file" "sp" ON "sp"."surveyPlanId" = "property"."id"
       LEFT JOIN "file" "loi" ON "loi"."letterOfIntentId" = "property"."id"
       LEFT JOIN "file" "doc" ON "doc"."deedOfConveyanceId" = "property"."id"`,
    );

    await queryRunner.query(
      `INSERT INTO "property_verification_version_other_document" ("id", "createdAt", "updatedAt", "label", "versionId", "fileId")
       SELECT uuid_generate_v4(), now(), now(), "file"."otherDocumentLabel", "version"."id", "file"."id"
       FROM "file"
       INNER JOIN "property_verification_version" "version" ON "version"."propertyId" = "file"."otherDocumentPropertyId"
       WHERE "file"."otherDocumentPropertyId" IS NOT NULL
       AND "file"."otherDocumentLabel" IS NOT NULL`,
    );

    await queryRunner.query(
      `UPDATE "property" SET "currentVerificationVersionId" = "version"."id"
       FROM "property_verification_version" "version"
       WHERE "version"."propertyId" = "property"."id"
       AND "property"."propertyVerificationStatus" = 'VERIFIED'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "property" DROP CONSTRAINT "FK_property_current_verification_version"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property" DROP COLUMN "currentVerificationVersionId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property_verification_version_other_document" DROP CONSTRAINT "FK_version_other_document_file"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property_verification_version_other_document" DROP CONSTRAINT "FK_version_other_document_version"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property_verification_version" DROP CONSTRAINT "FK_property_version_deed_of_conveyance"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property_verification_version" DROP CONSTRAINT "FK_property_version_letter_of_intent"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property_verification_version" DROP CONSTRAINT "FK_property_version_survey_plan"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property_verification_version" DROP CONSTRAINT "FK_property_version_contract_of_sale"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property_verification_version" DROP CONSTRAINT "FK_property_version_certification_of_occupancy"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property_verification_version" DROP CONSTRAINT "FK_property_verification_version_property"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_version_other_document_label"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_property_active_verification_version"`,
    );
    await queryRunner.query(
      `DROP TABLE "property_verification_version_other_document"`,
    );
    await queryRunner.query(`DROP TABLE "property_verification_version"`);
  }
}
