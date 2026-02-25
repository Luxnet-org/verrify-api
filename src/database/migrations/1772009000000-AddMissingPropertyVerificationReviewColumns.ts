import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddMissingPropertyVerificationReviewColumns1772009000000 implements MigrationInterface {
    name = 'AddMissingPropertyVerificationReviewColumns1772009000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('property_verification');

        if (table && !table.findColumnByName('reviewedAt')) {
            await queryRunner.addColumn('property_verification', new TableColumn({
                name: 'reviewedAt',
                type: 'timestamp with time zone',
                isNullable: true
            }));
        }

        if (table && !table.findColumnByName('reviewUserId')) {
            await queryRunner.addColumn('property_verification', new TableColumn({
                name: 'reviewUserId',
                type: 'uuid',
                isNullable: true
            }));

            await queryRunner.createForeignKey('property_verification', new TableForeignKey({
                columnNames: ['reviewUserId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'NO ACTION',
                onUpdate: 'NO ACTION',
            }));
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('property_verification');

        if (table) {
            const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf('reviewUserId') !== -1);
            if (foreignKey) {
                await queryRunner.dropForeignKey('property_verification', foreignKey);
            }
            if (table.findColumnByName('reviewUserId')) {
                await queryRunner.dropColumn('property_verification', 'reviewUserId');
            }
            if (table.findColumnByName('reviewedAt')) {
                await queryRunner.dropColumn('property_verification', 'reviewedAt');
            }
        }
    }
}
