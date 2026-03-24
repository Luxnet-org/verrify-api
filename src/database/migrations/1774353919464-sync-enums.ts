import { MigrationInterface, QueryRunner } from "typeorm";

export class SyncEnums1774353919464 implements MigrationInterface {
    name = 'SyncEnums1774353919464'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction" ADD "authorizationUrl" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "authorizationUrl"`);
    }

}
