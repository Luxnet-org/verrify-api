import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddMissingFileRelations1772008000000 implements MigrationInterface {
    name = 'AddMissingFileRelations1772008000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('file');

        if (table && !table.findColumnByName('propertyVerificationId')) {
            await queryRunner.addColumn('file', new TableColumn({
                name: 'propertyVerificationId',
                type: 'uuid',
                isNullable: true
            }));

            await queryRunner.createForeignKey('file', new TableForeignKey({
                columnNames: ['propertyVerificationId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'property_verification',
                onDelete: 'NO ACTION',
                onUpdate: 'NO ACTION',
            }));
        }

        if (table && !table.findColumnByName('adminPropertyVerificationId')) {
            await queryRunner.addColumn('file', new TableColumn({
                name: 'adminPropertyVerificationId',
                type: 'uuid',
                isNullable: true
            }));

            await queryRunner.createForeignKey('file', new TableForeignKey({
                columnNames: ['adminPropertyVerificationId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'property_verification',
                onDelete: 'NO ACTION',
                onUpdate: 'NO ACTION',
            }));
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('file');

        if (table) {
            const foreignKey1 = table.foreignKeys.find(fk => fk.columnNames.indexOf('adminPropertyVerificationId') !== -1);
            if (foreignKey1) {
                await queryRunner.dropForeignKey('file', foreignKey1);
            }
            if (table.findColumnByName('adminPropertyVerificationId')) {
                await queryRunner.dropColumn('file', 'adminPropertyVerificationId');
            }

            const foreignKey2 = table.foreignKeys.find(fk => fk.columnNames.indexOf('propertyVerificationId') !== -1);
            if (foreignKey2) {
                await queryRunner.dropForeignKey('file', foreignKey2);
            }
            if (table.findColumnByName('propertyVerificationId')) {
                await queryRunner.dropColumn('file', 'propertyVerificationId');
            }
        }
    }
}
