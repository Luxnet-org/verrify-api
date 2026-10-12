import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPropertyVerificationAdditionalInformation1781000000014
  implements MigrationInterface
{
  name = 'AddPropertyVerificationAdditionalInformation1781000000014';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "property_verification" ADD "additionalInformation" jsonb',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "property_verification" DROP COLUMN "additionalInformation"',
    );
  }
}
