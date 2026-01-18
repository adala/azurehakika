// migrations/xxxx-add-verification-fields.js
'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.sequelize.transaction(async (transaction) => {
            // Add new columns
            await queryInterface.addColumn('verifications', 'firstName', {
                type: Sequelize.STRING(100),
                allowNull: false,
                defaultValue: 'Unknown' // Temporary default for existing records
            }, { transaction });

            await queryInterface.addColumn('verifications', 'lastName', {
                type: Sequelize.STRING(100),
                allowNull: false,
                defaultValue: 'Unknown'
            }, { transaction });

            await queryInterface.addColumn('verifications', 'maidenName', {
                type: Sequelize.STRING(100),
                allowNull: true
            }, { transaction });

            await queryInterface.addColumn('verifications', 'dateOfBirth', {
                type: Sequelize.DATEONLY,
                allowNull: false,
                defaultValue: '2000-01-01'
            }, { transaction });

            await queryInterface.addColumn('verifications', 'degree', {
                type: Sequelize.STRING(255),
                allowNull: false,
                defaultValue: 'Unknown Degree'
            }, { transaction });

            await queryInterface.addColumn('verifications', 'graduationYear', {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: new Date().getFullYear()
            }, { transaction });

            await queryInterface.addColumn('verifications', 'studentId', {
                type: Sequelize.STRING(50),
                allowNull: true
            }, { transaction });

            await queryInterface.addColumn('verifications', 'additionalNotes', {
                type: Sequelize.TEXT,
                allowNull: true
            }, { transaction });

            await queryInterface.addColumn('verifications', 'estimatedCompletionDate', {
                type: Sequelize.DATE,
                allowNull: true
            }, { transaction });

            await queryInterface.addColumn('verifications', 'priority', {
                type: Sequelize.ENUM('low', 'normal', 'high', 'urgent'),
                defaultValue: 'normal'
            }, { transaction });

            await queryInterface.addColumn('verifications', 'verificationScore', {
                type: Sequelize.DECIMAL(5, 2),
                allowNull: true
            }, { transaction });

            // Create indexes
            await queryInterface.addIndex('verifications', ['graduationYear'], { transaction });
            await queryInterface.addIndex('verifications', ['firstName', 'lastName'], { transaction });
            await queryInterface.addIndex('verifications', ['status', 'process'], { transaction });
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.sequelize.transaction(async (transaction) => {
            // Remove indexes first
            await queryInterface.removeIndex('verifications', ['graduationYear'], { transaction });
            await queryInterface.removeIndex('verifications', ['firstName', 'lastName'], { transaction });
            await queryInterface.removeIndex('verifications', ['status', 'process'], { transaction });

            // Remove columns
            const columnsToRemove = [
                'firstName', 'lastName', 'maidenName', 'dateOfBirth', 'degree',
                'graduationYear', 'studentId', 'additionalNotes', 'estimatedCompletionDate',
                'priority', 'verificationScore'
            ];

            for (const column of columnsToRemove) {
                await queryInterface.removeColumn('verifications', column, { transaction });
            }

            // Remove enum types if needed (PostgreSQL specific)
            await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_verifications_priority;', { transaction });
        });
    }
};