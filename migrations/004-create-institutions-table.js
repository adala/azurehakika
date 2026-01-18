// infrastructure/database/migrations/XXXXXX-create-institutions-table.js

'use strict';
const { DataTypes } = require('sequelize');
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('institutions', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      type: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      country: {
        type: Sequelize.STRING(100),
        allowNull: false
      },

      // Descriptive Fields
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      founding_date: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      number_of_employees: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      number_of_students: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      legal_name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      logo: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      parent_organization: {
        type: Sequelize.STRING(255),
        allowNull: true
      },

      // Contact Information
      website: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      phone: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true
      },

      // Verification Process & Fees
      vfee: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      process: {
        type: Sequelize.ENUM('auto', 'manual'),
        allowNull: false,
        defaultValue: 'manual'
      },
      processing_time: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      api_endpoint: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      api_key: {
        type: Sequelize.STRING(500),
        allowNull: true
      },

      // System
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('institutions', ['code']);
    await queryInterface.addIndex('institutions', ['country']);
    await queryInterface.addIndex('institutions', ['type']);
    await queryInterface.addIndex('institutions', ['is_active']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('institutions');
  }
};
