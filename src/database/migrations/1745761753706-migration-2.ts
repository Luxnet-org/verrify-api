import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration21745761753706 implements MigrationInterface {
  name = 'Migration21745761753706';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."company_companyverificationstatus_enum" AS ENUM('NOT_VERIFIED', 'PENDING', 'VERIFIED', 'REJECTED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."company_proofofaddresstype_enum" AS ENUM('UTILITY_BILL', 'VOTER_CARD', 'BANK_STATEMENT', 'LEASE_AGREEMENT', 'DRIVER_LICENSE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "company" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "name" character varying, "description" text, "phoneNumber" character varying, "companyVerificationStatus" "public"."company_companyverificationstatus_enum" NOT NULL, "verificationMessage" text, "proofOfAddressType" "public"."company_proofofaddresstype_enum", "userId" uuid, CONSTRAINT "UQ_a76c5cd486f7779bd9c319afd27" UNIQUE ("name"), CONSTRAINT "REL_c41a1d36702f2cd0403ce58d33" UNIQUE ("userId"), CONSTRAINT "PK_056f7854a7afdba7cbd6d45fc20" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "location" ADD "companyId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "location" ADD CONSTRAINT "UQ_f267b47598f6f0f69feaafaeaae" UNIQUE ("companyId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ADD "companyAddressFileId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ADD CONSTRAINT "UQ_7d295b4cc78650d9748032944e7" UNIQUE ("companyAddressFileId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ADD "companyProfileImageId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ADD CONSTRAINT "UQ_6abb24436a7246cb4d0659463b4" UNIQUE ("companyProfileImageId")`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."file_filetype_enum" RENAME TO "file_filetype_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."file_filetype_enum" AS ENUM('PROFILE_PICTURE', 'PROOF_OF_ADDRESS', 'COMPANY_PROFILE_PICTURE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ALTER COLUMN "fileType" TYPE "public"."file_filetype_enum" USING "fileType"::"text"::"public"."file_filetype_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."file_filetype_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "location" ADD CONSTRAINT "FK_f267b47598f6f0f69feaafaeaae" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "company" ADD CONSTRAINT "FK_c41a1d36702f2cd0403ce58d33a" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ADD CONSTRAINT "FK_7d295b4cc78650d9748032944e7" FOREIGN KEY ("companyAddressFileId") REFERENCES "company"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ADD CONSTRAINT "FK_6abb24436a7246cb4d0659463b4" FOREIGN KEY ("companyProfileImageId") REFERENCES "company"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "file" DROP CONSTRAINT "FK_6abb24436a7246cb4d0659463b4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" DROP CONSTRAINT "FK_7d295b4cc78650d9748032944e7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company" DROP CONSTRAINT "FK_c41a1d36702f2cd0403ce58d33a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "location" DROP CONSTRAINT "FK_f267b47598f6f0f69feaafaeaae"`,
    );

    await queryRunner.query(
      `ALTER TABLE "file" DROP CONSTRAINT "UQ_6abb24436a7246cb4d0659463b4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" DROP COLUMN "companyProfileImageId"`,
    );

    await queryRunner.query(
      `ALTER TABLE "file" DROP CONSTRAINT "UQ_7d295b4cc78650d9748032944e7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" DROP COLUMN "companyAddressFileId"`,
    );

    await queryRunner.query(
      `ALTER TABLE "location" DROP CONSTRAINT "UQ_f267b47598f6f0f69feaafaeaae"`,
    );
    await queryRunner.query(`ALTER TABLE "location" DROP COLUMN "companyId"`);

    await queryRunner.query(`DROP TABLE "company"`);

    await queryRunner.query(
      `CREATE TYPE "public"."file_filetype_enum_old" AS ENUM('PROFILE_PICTURE', 'PROOF_OF_ADDRESS')`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ALTER COLUMN "fileType" TYPE "public"."file_filetype_enum_old" USING "fileType"::"text"::"public"."file_filetype_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."file_filetype_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."file_filetype_enum_old" RENAME TO "file_filetype_enum"`,
    );

    await queryRunner.query(
      `DROP TYPE "public"."company_proofofaddresstype_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."company_companyverificationstatus_enum"`,
    );
  }
}
