import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration31748290171261 implements MigrationInterface {
  name = 'Migration31748290171261';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."property_propertytype_enum" AS ENUM('LAND', 'HOUSE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."property_propertyverificationstatus_enum" AS ENUM('NOT_VERIFIED', 'PENDING', 'VERIFIED', 'REJECTED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "property" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "name" character varying NOT NULL, "description" text, "isSubProperty" boolean NOT NULL DEFAULT false, "propertyType" "public"."property_propertytype_enum" NOT NULL, "isPublic" boolean NOT NULL DEFAULT false, "propertyVerificationStatus" "public"."property_propertyverificationstatus_enum" NOT NULL, "verificationMessage" text, "area" double precision, "companyId" uuid, "parentPropertyId" uuid, CONSTRAINT "PK_d80743e6191258a5003d5843b4f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_property" ("propertyId" uuid NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "PK_256dd4523389261e6cb245c7f99" PRIMARY KEY ("propertyId", "userId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fc567b505a70bec22246173623" ON "user_property" ("propertyId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8cb24d53924eaf3d02e38e43d7" ON "user_property" ("userId") `,
    );
    await queryRunner.query(`ALTER TABLE "location" ADD "propertyId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "location" ADD CONSTRAINT "UQ_610e189d34848d306f581b71d72" UNIQUE ("propertyId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ADD "certificationOfOccupancyId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ADD CONSTRAINT "UQ_629077d98ea51b48cf51434beac" UNIQUE ("certificationOfOccupancyId")`,
    );
    await queryRunner.query(`ALTER TABLE "file" ADD "contractOfSaleId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "file" ADD CONSTRAINT "UQ_e1daef5c0d968656ff1de69fa33" UNIQUE ("contractOfSaleId")`,
    );
    await queryRunner.query(`ALTER TABLE "file" ADD "surveyPlanId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "file" ADD CONSTRAINT "UQ_a0833c2d6360d53fad0a00ccbc5" UNIQUE ("surveyPlanId")`,
    );
    await queryRunner.query(`ALTER TABLE "file" ADD "letterOfIntentId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "file" ADD CONSTRAINT "UQ_059a662c270f9a3ab7f238e6c32" UNIQUE ("letterOfIntentId")`,
    );
    await queryRunner.query(`ALTER TABLE "file" ADD "deedOfConveyanceId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "file" ADD CONSTRAINT "UQ_b5f971f08131638701f26fd6794" UNIQUE ("deedOfConveyanceId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "location" DROP COLUMN "locationPolygon"`,
    );
    await queryRunner.query(
      `ALTER TABLE "location" ADD "locationPolygon" geometry(Polygon,4326)`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."file_filetype_enum" RENAME TO "file_filetype_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."file_filetype_enum" AS ENUM('PROFILE_PICTURE', 'PROOF_OF_ADDRESS', 'COMPANY_PROFILE_PICTURE', 'CERTIFICATE_OF_OCCUPANCY', 'CONTRACT_OF_SALE', 'SURVEY_PLAN', 'LETTER_OF_INTENT', 'DEED_OF_CONVEYANCE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ALTER COLUMN "fileType" TYPE "public"."file_filetype_enum" USING "fileType"::"text"::"public"."file_filetype_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."file_filetype_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "property" ADD CONSTRAINT "FK_8d01ee8f3f75c10e18e6b4ef6d0" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "property" ADD CONSTRAINT "FK_f32ef1c406e104a7c2b58b59676" FOREIGN KEY ("parentPropertyId") REFERENCES "property"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "location" ADD CONSTRAINT "FK_610e189d34848d306f581b71d72" FOREIGN KEY ("propertyId") REFERENCES "property"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ADD CONSTRAINT "FK_629077d98ea51b48cf51434beac" FOREIGN KEY ("certificationOfOccupancyId") REFERENCES "property"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ADD CONSTRAINT "FK_e1daef5c0d968656ff1de69fa33" FOREIGN KEY ("contractOfSaleId") REFERENCES "property"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ADD CONSTRAINT "FK_a0833c2d6360d53fad0a00ccbc5" FOREIGN KEY ("surveyPlanId") REFERENCES "property"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ADD CONSTRAINT "FK_059a662c270f9a3ab7f238e6c32" FOREIGN KEY ("letterOfIntentId") REFERENCES "property"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ADD CONSTRAINT "FK_b5f971f08131638701f26fd6794" FOREIGN KEY ("deedOfConveyanceId") REFERENCES "property"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_property" ADD CONSTRAINT "FK_fc567b505a70bec222461736237" FOREIGN KEY ("propertyId") REFERENCES "property"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_property" ADD CONSTRAINT "FK_8cb24d53924eaf3d02e38e43d7a" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );

    await queryRunner.query(
      `CREATE INDEX ON location USING GIST("locationPolygon")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_property" DROP CONSTRAINT "FK_8cb24d53924eaf3d02e38e43d7a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_property" DROP CONSTRAINT "FK_fc567b505a70bec222461736237"`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" DROP CONSTRAINT "FK_b5f971f08131638701f26fd6794"`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" DROP CONSTRAINT "FK_059a662c270f9a3ab7f238e6c32"`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" DROP CONSTRAINT "FK_a0833c2d6360d53fad0a00ccbc5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" DROP CONSTRAINT "FK_e1daef5c0d968656ff1de69fa33"`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" DROP CONSTRAINT "FK_629077d98ea51b48cf51434beac"`,
    );
    await queryRunner.query(
      `ALTER TABLE "location" DROP CONSTRAINT "FK_610e189d34848d306f581b71d72"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property" DROP CONSTRAINT "FK_f32ef1c406e104a7c2b58b59676"`,
    );
    await queryRunner.query(
      `ALTER TABLE "property" DROP CONSTRAINT "FK_8d01ee8f3f75c10e18e6b4ef6d0"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."file_filetype_enum_old" AS ENUM('PROFILE_PICTURE', 'PROOF_OF_ADDRESS', 'COMPANY_PROFILE_PICTURE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ALTER COLUMN "fileType" TYPE "public"."file_filetype_enum_old" USING "fileType"::"text"::"public"."file_filetype_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."file_filetype_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."file_filetype_enum_old" RENAME TO "file_filetype_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "location" DROP COLUMN "locationPolygon"`,
    );
    await queryRunner.query(
      `ALTER TABLE "location" ADD "locationPolygon" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" DROP CONSTRAINT "UQ_b5f971f08131638701f26fd6794"`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" DROP COLUMN "deedOfConveyanceId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" DROP CONSTRAINT "UQ_059a662c270f9a3ab7f238e6c32"`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" DROP COLUMN "letterOfIntentId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" DROP CONSTRAINT "UQ_a0833c2d6360d53fad0a00ccbc5"`,
    );
    await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "surveyPlanId"`);
    await queryRunner.query(
      `ALTER TABLE "file" DROP CONSTRAINT "UQ_e1daef5c0d968656ff1de69fa33"`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" DROP COLUMN "contractOfSaleId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" DROP CONSTRAINT "UQ_629077d98ea51b48cf51434beac"`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" DROP COLUMN "certificationOfOccupancyId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "location" DROP CONSTRAINT "UQ_610e189d34848d306f581b71d72"`,
    );
    await queryRunner.query(`ALTER TABLE "location" DROP COLUMN "propertyId"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8cb24d53924eaf3d02e38e43d7"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fc567b505a70bec22246173623"`,
    );
    await queryRunner.query(`DROP TABLE "user_property"`);
    await queryRunner.query(`DROP TABLE "property"`);
    await queryRunner.query(
      `DROP TYPE "public"."property_propertyverificationstatus_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."property_propertytype_enum"`);
  }
}
