// migrations/YYYYMMDDHHMMSS-add-academic-fields-to-verifications.js

'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add new academic fields
    await queryInterface.addColumn('verifications', 'courseName', {
      type: Sequelize.STRING(255),
      allowNull: false,
      defaultValue: 'Unknown Course'
    });

    await queryInterface.addColumn('verifications', 'degreeType', {
      type: Sequelize.STRING(100),
      allowNull: false,
      defaultValue: 'Other'
    });

    await queryInterface.addColumn('verifications', 'classification', {
      type: Sequelize.STRING(50),
      allowNull: true
    });

    // Rename 'degree' to 'fieldOfStudy' for clarity
    await queryInterface.renameColumn('verifications', 'degree', 'fieldOfStudy');

    // Update the default value for courseName to be empty string instead of 'Unknown Course'
    await queryInterface.changeColumn('verifications', 'courseName', {
      type: Sequelize.STRING(255),
      allowNull: false,
      defaultValue: ''
    });

    // Create index for common queries on new fields
    await queryInterface.addIndex('verifications', ['courseName']);
    await queryInterface.addIndex('verifications', ['degreeType']);
    await queryInterface.addIndex('verifications', ['classification']);
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex('verifications', ['courseName']);
    await queryInterface.removeIndex('verifications', ['degreeType']);
    await queryInterface.removeIndex('verifications', ['classification']);

    // Rename fieldOfStudy back to degree
    await queryInterface.renameColumn('verifications', 'fieldOfStudy', 'degree');

    // Remove new columns
    await queryInterface.removeColumn('verifications', 'courseName');
    await queryInterface.removeColumn('verifications', 'degreeType');
    await queryInterface.removeColumn('verifications', 'classification');
  }
};