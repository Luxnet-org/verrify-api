import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPropertyVerificationAndPayment1771673049809 implements MigrationInterface {
    name = 'AddPropertyVerificationAndPayment1771673049809'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."property_verification_stage_enum" AS ENUM('INITIATED', 'PENDING_ACCEPTANCE', 'VERIFICATION_ACCEPTED', 'VERIFICATION_REJECTED', 'PENDING_PAYMENT', 'PAYMENT_VERIFIED', 'STAGE_1', 'STAGE_2', 'STAGE_3', 'VERIFICATION_COMPLETE')`);
        await queryRunner.query(`CREATE TABLE "property_verification" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "stage" "public"."property_verification_stage_enum" NOT NULL DEFAULT 'INITIATED', "caseId" character varying, "adminComments" text, "verificationFiles" text, "propertyId" uuid, "userId" uuid, CONSTRAINT "PK_8167775e89b1595599b28cf8a36" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_8ac2d67860be9dfaeb74a42a2f" ON "property_verification" ("caseId") WHERE "caseId" IS NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."order_status_enum" AS ENUM('PENDING', 'PAID', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "order" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "amount" numeric(10,2) NOT NULL, "currency" character varying NOT NULL DEFAULT 'NGN', "status" "public"."order_status_enum" NOT NULL DEFAULT 'PENDING', "userId" uuid, "propertyVerificationId" uuid, CONSTRAINT "PK_1031171c13130102495201e3e20" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."transaction_status_enum" AS ENUM('PENDING', 'SUCCESS', 'FAILED')`);
        await queryRunner.query(`CREATE TABLE "transaction" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "amount" numeric(10,2) NOT NULL, "paystackReference" character varying NOT NULL, "status" "public"."transaction_status_enum" NOT NULL DEFAULT 'PENDING', "orderId" uuid, CONSTRAINT "PK_89eadb93a89810556e1cbcd6ab9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_bbc996c9e0147610714bc40291" ON "transaction" ("paystackReference") `);
        await queryRunner.query(`ALTER TABLE "property_verification" ADD CONSTRAINT "FK_986c5deeeb8fa01b5e27d6fefaa" FOREIGN KEY ("propertyId") REFERENCES "property"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "property_verification" ADD CONSTRAINT "FK_0b0650d37b5bf12a46434d842bb" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order" ADD CONSTRAINT "FK_caabe91507b3379c7ba73637b84" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order" ADD CONSTRAINT "FK_43982342e407b4ae76116fd678c" FOREIGN KEY ("propertyVerificationId") REFERENCES "property_verification"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD CONSTRAINT "FK_a6e45c89cfbe8d92840266fd30f" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT "FK_a6e45c89cfbe8d92840266fd30f"`);
        await queryRunner.query(`ALTER TABLE "order" DROP CONSTRAINT "FK_43982342e407b4ae76116fd678c"`);
        await queryRunner.query(`ALTER TABLE "order" DROP CONSTRAINT "FK_caabe91507b3379c7ba73637b84"`);
        await queryRunner.query(`ALTER TABLE "property_verification" DROP CONSTRAINT "FK_0b0650d37b5bf12a46434d842bb"`);
        await queryRunner.query(`ALTER TABLE "property_verification" DROP CONSTRAINT "FK_986c5deeeb8fa01b5e27d6fefaa"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bbc996c9e0147610714bc40291"`);
        await queryRunner.query(`DROP TABLE "transaction"`);
        await queryRunner.query(`DROP TYPE "public"."transaction_status_enum"`);
        await queryRunner.query(`DROP TABLE "order"`);
        await queryRunner.query(`DROP TYPE "public"."order_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8ac2d67860be9dfaeb74a42a2f"`);
        await queryRunner.query(`DROP TABLE "property_verification"`);
        await queryRunner.query(`DROP TYPE "public"."property_verification_stage_enum"`);
    }

}
