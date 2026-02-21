import { MigrationInterface, QueryRunner } from "typeorm";

export class ActionVerificationAndPortfolio1771618991552 implements MigrationInterface {
    name = 'ActionVerificationAndPortfolio1771618991552'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "portfolio_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "userId" uuid, "propertyId" uuid, CONSTRAINT "PK_c636df11b3cc98f390c8efc656a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_7ec721ebc4a2c3f8b31f45937f" ON "portfolio_items" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_ca588e56342ea5ae93b74aa972" ON "portfolio_items" ("propertyId") `);
        await queryRunner.query(`CREATE TYPE "public"."action_verification_verificationtype_enum" AS ENUM('EMAIL_VERIFICATION', 'ACCOUNT_VERIFICATION', 'PASSWORD_RESET')`);
        await queryRunner.query(`CREATE TABLE "action_verification" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "token" character varying NOT NULL, "verificationType" "public"."action_verification_verificationtype_enum" NOT NULL, "expireAt" TIMESTAMP WITH TIME ZONE NOT NULL, "verified" boolean NOT NULL DEFAULT false, "destination" character varying NOT NULL, CONSTRAINT "UQ_c7d81cebd66aa38c23f0efddb0e" UNIQUE ("token"), CONSTRAINT "PK_0cb1d312eefebe247171650e270" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "property" ADD "pin" character varying`);
        await queryRunner.query(`ALTER TABLE "property" ADD CONSTRAINT "UQ_afe3a18be8be190392a1346e656" UNIQUE ("pin")`);
        await queryRunner.query(`CREATE INDEX "IDX_afe3a18be8be190392a1346e65" ON "property" ("pin") `);
        await queryRunner.query(`CREATE INDEX "IDX_a76c5cd486f7779bd9c319afd2" ON "company" ("name") `);
        await queryRunner.query(`CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`ALTER TABLE "portfolio_items" ADD CONSTRAINT "FK_7ec721ebc4a2c3f8b31f45937fc" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "portfolio_items" ADD CONSTRAINT "FK_ca588e56342ea5ae93b74aa9722" FOREIGN KEY ("propertyId") REFERENCES "property"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "portfolio_items" DROP CONSTRAINT "FK_ca588e56342ea5ae93b74aa9722"`);
        await queryRunner.query(`ALTER TABLE "portfolio_items" DROP CONSTRAINT "FK_7ec721ebc4a2c3f8b31f45937fc"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a76c5cd486f7779bd9c319afd2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_afe3a18be8be190392a1346e65"`);
        await queryRunner.query(`ALTER TABLE "property" DROP CONSTRAINT "UQ_afe3a18be8be190392a1346e656"`);
        await queryRunner.query(`ALTER TABLE "property" DROP COLUMN "pin"`);
        await queryRunner.query(`DROP TABLE "action_verification"`);
        await queryRunner.query(`DROP TYPE "public"."action_verification_verificationtype_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ca588e56342ea5ae93b74aa972"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7ec721ebc4a2c3f8b31f45937f"`);
        await queryRunner.query(`DROP TABLE "portfolio_items"`);
    }

}
