import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrationInit1744459008669 implements MigrationInterface {
  name = 'MigrationInit1744459008669';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."verification_verificationtype_enum" AS ENUM('EMAIL_VERIFICATION', 'ACCOUNT_VERIFICATION', 'PASSWORD_RESET')`,
    );
    await queryRunner.query(
      `CREATE TABLE "verification" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "token" character varying NOT NULL, "verificationType" "public"."verification_verificationtype_enum" NOT NULL, "expireAt" TIMESTAMP WITH TIME ZONE NOT NULL, "verified" boolean NOT NULL DEFAULT false, "destination" character varying NOT NULL, CONSTRAINT "UQ_9f6123129312c1eb442bec455d6" UNIQUE ("token"), CONSTRAINT "PK_f7e3a90ca384e71d6e2e93bb340" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."file_filetype_enum" AS ENUM('PROFILE_PICTURE', 'PROOF_OF_ADDRESS')`,
    );
    await queryRunner.query(
      `CREATE TABLE "file" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "fileType" "public"."file_filetype_enum" NOT NULL, "url" character varying NOT NULL, "fileName" character varying NOT NULL, "userId" uuid, CONSTRAINT "UQ_ff5d246bb5831ad7351f87e67cb" UNIQUE ("url"), CONSTRAINT "REL_b2d8e683f020f61115edea206b" UNIQUE ("userId"), CONSTRAINT "PK_36b46d232307066b3a2c9ea3a1d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "location" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "country" character varying, "state" character varying, "city" character varying, "address" character varying, "location" character varying, "locationPolygon" character varying, "userId" uuid, CONSTRAINT "REL_bdef5f9d46ef330ddca009a859" UNIQUE ("userId"), CONSTRAINT "PK_876d7bdba03c72251ec4c2dc827" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('ADMIN', 'SUPER_ADMIN', 'USER', 'SUPPORT')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "firstName" character varying NOT NULL, "lastName" character varying, "dob" date, "role" "public"."users_role_enum" NOT NULL, "username" character varying, "email" character varying NOT NULL, "passwordHash" character varying NOT NULL, "phoneNumber" character varying, "lastLogin" TIMESTAMP WITH TIME ZONE, "fcmToken" character varying, "is2fa" boolean NOT NULL DEFAULT false, "isVerified" boolean NOT NULL DEFAULT false, "isGoogleLogin" boolean NOT NULL DEFAULT false, "isAgreed" boolean NOT NULL, "isEnabled" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "token" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "valid" boolean NOT NULL DEFAULT true, "refreshToken" character varying NOT NULL, "ip" character varying NOT NULL, "userAgent" character varying NOT NULL, "expireAt" TIMESTAMP WITH TIME ZONE NOT NULL, "user_id" uuid, CONSTRAINT "UQ_9075147ba4bb2ead8bac71ccc83" UNIQUE ("refreshToken"), CONSTRAINT "PK_82fae97f905930df5d62a702fc9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_refreshToken" ON "token" ("refreshToken") `,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ADD CONSTRAINT "FK_b2d8e683f020f61115edea206b3" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "location" ADD CONSTRAINT "FK_bdef5f9d46ef330ddca009a8596" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "token" ADD CONSTRAINT "FK_e50ca89d635960fda2ffeb17639" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "token" DROP CONSTRAINT "FK_e50ca89d635960fda2ffeb17639"`,
    );
    await queryRunner.query(
      `ALTER TABLE "location" DROP CONSTRAINT "FK_bdef5f9d46ef330ddca009a8596"`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" DROP CONSTRAINT "FK_b2d8e683f020f61115edea206b3"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_refreshToken"`);
    await queryRunner.query(`DROP TABLE "token"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(`DROP TABLE "location"`);
    await queryRunner.query(`DROP TABLE "file"`);
    await queryRunner.query(`DROP TYPE "public"."file_filetype_enum"`);
    await queryRunner.query(`DROP TABLE "verification"`);
    await queryRunner.query(
      `DROP TYPE "public"."verification_verificationtype_enum"`,
    );
  }
}
