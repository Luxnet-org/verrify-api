import { MigrationInterface, QueryRunner } from 'typeorm';

export class BaselineSchema1781000000000 implements MigrationInterface {
  name = 'BaselineSchema1781000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "postgis"`);

    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('ADMIN', 'SUPER_ADMIN', 'USER', 'SUPPORT')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."file_filetype_enum" AS ENUM('PROFILE_PICTURE', 'PROOF_OF_ADDRESS', 'COMPANY_PROFILE_PICTURE', 'CERTIFICATE_OF_OCCUPANCY', 'CONTRACT_OF_SALE', 'SURVEY_PLAN', 'LETTER_OF_INTENT', 'DEED_OF_CONVEYANCE', 'ARTICLE_TITLE_IMAGE', 'VERIFICATION_DOCUMENT', 'ADMIN_STAGE_DOCUMENT')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."action_verification_verificationtype_enum" AS ENUM('EMAIL_VERIFICATION', 'ACCOUNT_VERIFICATION', 'PASSWORD_RESET')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."company_companyverificationstatus_enum" AS ENUM('NOT_VERIFIED', 'PENDING', 'IN_REVIEW', 'VERIFIED', 'REJECTED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."company_proofofaddresstype_enum" AS ENUM('UTILITY_BILL', 'VOTER_CARD', 'BANK_STATEMENT', 'LEASE_AGREEMENT', 'DRIVER_LICENSE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."property_propertytype_enum" AS ENUM('LAND', 'HOUSE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."property_propertyverificationstatus_enum" AS ENUM('NOT_VERIFIED', 'PENDING', 'IN_REVIEW', 'VERIFIED', 'REJECTED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."article_articlestatus_enum" AS ENUM('DRAFT', 'PUBLISHED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."property_verification_stage_enum" AS ENUM('INITIATED', 'PENDING_ACCEPTANCE', 'IN_REVIEW', 'VERIFICATION_ACCEPTED', 'VERIFICATION_REJECTED', 'PENDING_PAYMENT', 'PAYMENT_VERIFIED', 'STAGE_1', 'STAGE_2', 'STAGE_3', 'VERIFICATION_COMPLETE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."order_status_enum" AS ENUM('PENDING', 'PAID', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."transaction_status_enum" AS ENUM('PENDING', 'SUCCESS', 'FAILED')`,
    );

    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "firstName" character varying NOT NULL, "lastName" character varying, "dob" date, "role" "public"."users_role_enum" NOT NULL, "username" character varying, "email" character varying NOT NULL, "passwordHash" character varying NOT NULL, "phoneNumber" character varying, "lastLogin" TIMESTAMP WITH TIME ZONE, "fcmToken" character varying, "is2fa" boolean NOT NULL DEFAULT false, "isVerified" boolean NOT NULL DEFAULT false, "isGoogleLogin" boolean NOT NULL DEFAULT false, "isAgreed" boolean NOT NULL, "isEnabled" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_users_username" UNIQUE ("username"), CONSTRAINT "UQ_users_email" UNIQUE ("email"), CONSTRAINT "PK_users" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email")`,
    );

    await queryRunner.query(
      `CREATE TABLE "location" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "country" character varying, "state" character varying, "city" character varying, "address" character varying, "location" character varying, "locationPolygon" geometry(Polygon,4326), "userId" uuid, "companyId" uuid, "propertyId" uuid, CONSTRAINT "UQ_location_user" UNIQUE ("userId"), CONSTRAINT "UQ_location_company" UNIQUE ("companyId"), CONSTRAINT "UQ_location_property" UNIQUE ("propertyId"), CONSTRAINT "PK_location" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_location_polygon" ON "location" USING GiST ("locationPolygon")`,
    );

    await queryRunner.query(
      `CREATE TABLE "token" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "valid" boolean NOT NULL DEFAULT true, "refreshToken" character varying NOT NULL, "ip" character varying NOT NULL, "userAgent" character varying NOT NULL, "expireAt" TIMESTAMP WITH TIME ZONE NOT NULL, "user_id" uuid, CONSTRAINT "UQ_token_refreshToken" UNIQUE ("refreshToken"), CONSTRAINT "PK_token" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_refreshToken" ON "token" ("refreshToken")`,
    );

    await queryRunner.query(
      `CREATE TABLE "action_verification" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "token" character varying NOT NULL, "verificationType" "public"."action_verification_verificationtype_enum" NOT NULL, "expireAt" TIMESTAMP WITH TIME ZONE NOT NULL, "verified" boolean NOT NULL DEFAULT false, "destination" character varying NOT NULL, CONSTRAINT "UQ_action_verification_token" UNIQUE ("token"), CONSTRAINT "PK_action_verification" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE TABLE "company" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "name" character varying, "description" text, "phoneNumber" character varying, "companyVerificationStatus" "public"."company_companyverificationstatus_enum" NOT NULL, "verificationMessage" text, "reviewedAt" TIMESTAMP WITH TIME ZONE, "verifiedAt" TIMESTAMP WITH TIME ZONE, "proofOfAddressType" "public"."company_proofofaddresstype_enum", "reviewUserId" uuid, "userId" uuid, CONSTRAINT "UQ_company_name" UNIQUE ("name"), CONSTRAINT "UQ_company_user" UNIQUE ("userId"), CONSTRAINT "PK_company" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a76c5cd486f7779bd9c319afd2" ON "company" ("name")`,
    );

    await queryRunner.query(
      `CREATE TABLE "property" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "name" character varying NOT NULL, "description" text, "pin" character varying, "isSubProperty" boolean NOT NULL DEFAULT false, "propertyType" "public"."property_propertytype_enum" NOT NULL, "isPublic" boolean NOT NULL DEFAULT false, "propertyVerificationStatus" "public"."property_propertyverificationstatus_enum" NOT NULL, "verificationMessage" text, "reviewedAt" TIMESTAMP WITH TIME ZONE, "verifiedAt" TIMESTAMP WITH TIME ZONE, "area" double precision, "reviewUserId" uuid, "companyId" uuid, "parentPropertyId" uuid, CONSTRAINT "UQ_property_pin" UNIQUE ("pin"), CONSTRAINT "PK_property" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_afe3a18be8be190392a1346e65" ON "property" ("pin")`,
    );

    await queryRunner.query(
      `CREATE TABLE "verification_package" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "name" character varying NOT NULL, "description" text NOT NULL, "price" numeric(10,2) NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "sortOrder" integer NOT NULL DEFAULT 0, CONSTRAINT "UQ_verification_package_sortOrder" UNIQUE ("sortOrder"), CONSTRAINT "PK_verification_package" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE TABLE "property_verification" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "stage" "public"."property_verification_stage_enum" NOT NULL DEFAULT 'INITIATED', "caseId" character varying, "adminComments" text, "reviewedAt" TIMESTAMP WITH TIME ZONE, "stageHistory" text NOT NULL DEFAULT '[]', "propertyId" uuid, "userId" uuid, "reviewUserId" uuid, "verificationPackageId" uuid, CONSTRAINT "PK_property_verification" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_8ac2d67860be9dfaeb74a42a2f" ON "property_verification" ("caseId") WHERE "caseId" IS NOT NULL`,
    );

    await queryRunner.query(
      `CREATE TABLE "file" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "fileType" "public"."file_filetype_enum" NOT NULL, "url" character varying NOT NULL, "fileName" character varying NOT NULL, "userId" uuid, "companyAddressFileId" uuid, "companyProfileImageId" uuid, "certificationOfOccupancyId" uuid, "contractOfSaleId" uuid, "surveyPlanId" uuid, "letterOfIntentId" uuid, "deedOfConveyanceId" uuid, "articleTitleImageId" uuid, "propertyVerificationId" uuid, "adminPropertyVerificationId" uuid, CONSTRAINT "UQ_file_url" UNIQUE ("url"), CONSTRAINT "UQ_file_user" UNIQUE ("userId"), CONSTRAINT "UQ_file_company_address" UNIQUE ("companyAddressFileId"), CONSTRAINT "UQ_file_company_profile" UNIQUE ("companyProfileImageId"), CONSTRAINT "UQ_file_certification_of_occupancy" UNIQUE ("certificationOfOccupancyId"), CONSTRAINT "UQ_file_contract_of_sale" UNIQUE ("contractOfSaleId"), CONSTRAINT "UQ_file_survey_plan" UNIQUE ("surveyPlanId"), CONSTRAINT "UQ_file_letter_of_intent" UNIQUE ("letterOfIntentId"), CONSTRAINT "UQ_file_deed_of_conveyance" UNIQUE ("deedOfConveyanceId"), CONSTRAINT "UQ_file_article_title_image" UNIQUE ("articleTitleImageId"), CONSTRAINT "PK_file" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE TABLE "article" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "title" character varying NOT NULL, "description" text NOT NULL, "slug" character varying NOT NULL, "content" jsonb NOT NULL, "publishedAt" TIMESTAMP WITH TIME ZONE, "articleStatus" "public"."article_articlestatus_enum" NOT NULL, "featuredFlag" boolean NOT NULL DEFAULT false, "createdUserId" uuid, CONSTRAINT "UQ_article_slug" UNIQUE ("slug"), CONSTRAINT "UQ_article_created_user" UNIQUE ("createdUserId"), CONSTRAINT "PK_article" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE TABLE "portfolio_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "userId" uuid, "propertyId" uuid, CONSTRAINT "PK_portfolio_items" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7ec721ebc4a2c3f8b31f45937f" ON "portfolio_items" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ca588e56342ea5ae93b74aa972" ON "portfolio_items" ("propertyId")`,
    );

    await queryRunner.query(
      `CREATE TABLE "user_property" ("propertyId" uuid NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "PK_user_property" PRIMARY KEY ("propertyId", "userId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fc567b505a70bec22246173623" ON "user_property" ("propertyId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8cb24d53924eaf3d02e38e43d7" ON "user_property" ("userId")`,
    );

    await queryRunner.query(
      `CREATE TABLE "order" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "amount" numeric(10,2) NOT NULL, "currency" character varying NOT NULL DEFAULT 'NGN', "status" "public"."order_status_enum" NOT NULL DEFAULT 'PENDING', "userId" uuid, "propertyVerificationId" uuid, "verificationPackageId" uuid, CONSTRAINT "PK_order" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE TABLE "transaction" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "amount" numeric(10,2) NOT NULL, "paystackReference" character varying NOT NULL, "status" "public"."transaction_status_enum" NOT NULL DEFAULT 'PENDING', "authorizationUrl" character varying, "orderId" uuid, CONSTRAINT "PK_transaction" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_bbc996c9e0147610714bc40291" ON "transaction" ("paystackReference")`,
    );

    await queryRunner.query(
      `ALTER TABLE "location" ADD CONSTRAINT "FK_bdef5f9d46ef330ddca009a8596" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "location" ADD CONSTRAINT "FK_f267b47598f6f0f69feaafaeaae" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "location" ADD CONSTRAINT "FK_610e189d34848d306f581b71d72" FOREIGN KEY ("propertyId") REFERENCES "property"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "token" ADD CONSTRAINT "FK_e50ca89d635960fda2ffeb17639" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "company" ADD CONSTRAINT "FK_4bba9c58eec53af16b3a03138a4" FOREIGN KEY ("reviewUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "company" ADD CONSTRAINT "FK_c41a1d36702f2cd0403ce58d33a" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "property" ADD CONSTRAINT "FK_eecf0fc6da2eeb5f741d496bc7c" FOREIGN KEY ("reviewUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "property" ADD CONSTRAINT "FK_8d01ee8f3f75c10e18e6b4ef6d0" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "property" ADD CONSTRAINT "FK_f32ef1c406e104a7c2b58b59676" FOREIGN KEY ("parentPropertyId") REFERENCES "property"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "property_verification" ADD CONSTRAINT "FK_986c5deeeb8fa01b5e27d6fefaa" FOREIGN KEY ("propertyId") REFERENCES "property"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "property_verification" ADD CONSTRAINT "FK_0b0650d37b5bf12a46434d842bb" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "property_verification" ADD CONSTRAINT "FK_ef51e9146ad1839bc9ed9f490ce" FOREIGN KEY ("reviewUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "property_verification" ADD CONSTRAINT "FK_764129c646ed083a726b1606442" FOREIGN KEY ("verificationPackageId") REFERENCES "verification_package"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ADD CONSTRAINT "FK_b2d8e683f020f61115edea206b3" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ADD CONSTRAINT "FK_7d295b4cc78650d9748032944e7" FOREIGN KEY ("companyAddressFileId") REFERENCES "company"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ADD CONSTRAINT "FK_6abb24436a7246cb4d0659463b4" FOREIGN KEY ("companyProfileImageId") REFERENCES "company"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
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
      `ALTER TABLE "file" ADD CONSTRAINT "FK_4d57d2a7eac64846a2d9243c697" FOREIGN KEY ("articleTitleImageId") REFERENCES "article"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ADD CONSTRAINT "FK_3b027a1b615d55104581d83bb29" FOREIGN KEY ("propertyVerificationId") REFERENCES "property_verification"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ADD CONSTRAINT "FK_2631fb540d9e719a39c4ee04dc6" FOREIGN KEY ("adminPropertyVerificationId") REFERENCES "property_verification"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "article" ADD CONSTRAINT "FK_f9abd67735499ed02df43f30f15" FOREIGN KEY ("createdUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "portfolio_items" ADD CONSTRAINT "FK_7ec721ebc4a2c3f8b31f45937fc" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "portfolio_items" ADD CONSTRAINT "FK_ca588e56342ea5ae93b74aa9722" FOREIGN KEY ("propertyId") REFERENCES "property"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_property" ADD CONSTRAINT "FK_fc567b505a70bec222461736237" FOREIGN KEY ("propertyId") REFERENCES "property"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_property" ADD CONSTRAINT "FK_8cb24d53924eaf3d02e38e43d7a" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "order" ADD CONSTRAINT "FK_caabe91507b3379c7ba73637b84" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order" ADD CONSTRAINT "FK_43982342e407b4ae76116fd678c" FOREIGN KEY ("propertyVerificationId") REFERENCES "property_verification"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order" ADD CONSTRAINT "FK_af19812bd17d958a85dc96ffd0b" FOREIGN KEY ("verificationPackageId") REFERENCES "verification_package"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD CONSTRAINT "FK_a6e45c89cfbe8d92840266fd30f" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "transaction"`);
    await queryRunner.query(`DROP TABLE "order"`);
    await queryRunner.query(`DROP TABLE "user_property"`);
    await queryRunner.query(`DROP TABLE "portfolio_items"`);
    await queryRunner.query(`DROP TABLE "file"`);
    await queryRunner.query(`DROP TABLE "article"`);
    await queryRunner.query(`DROP TABLE "property_verification"`);
    await queryRunner.query(`DROP TABLE "verification_package"`);
    await queryRunner.query(`DROP TABLE "location"`);
    await queryRunner.query(`DROP TABLE "property"`);
    await queryRunner.query(`DROP TABLE "company"`);
    await queryRunner.query(`DROP TABLE "action_verification"`);
    await queryRunner.query(`DROP TABLE "token"`);
    await queryRunner.query(`DROP TABLE "users"`);

    await queryRunner.query(`DROP TYPE "public"."transaction_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."order_status_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."property_verification_stage_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."article_articlestatus_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."property_propertyverificationstatus_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."property_propertytype_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."company_proofofaddresstype_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."company_companyverificationstatus_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."action_verification_verificationtype_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."file_filetype_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}
