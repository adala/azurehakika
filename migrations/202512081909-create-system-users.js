'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('system_users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      username: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      firstName: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      lastName: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      role: {
        type: Sequelize.ENUM('admin', 'supervisor', 'worker'),
        defaultValue: 'worker',
        allowNull: false
      },
      department: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      country: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      lastLoginAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      passwordChangedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      failedLoginAttempts: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      accountLockedUntil: {
        type: Sequelize.DATE,
        allowNull: true
      },
      mustChangePassword: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create indexes
    // await queryInterface.addIndex('system_users', ['username'], {
    //   unique: true,
    //   name: 'system_users_username_unique'
    // });

    // await queryInterface.addIndex('system_users', ['email'], {
    //   unique: true,
    //   name: 'system_users_email_unique'
    // });

    // await queryInterface.addIndex('system_users', ['role'], {
    //   name: 'system_users_role_idx'
    // });

    // await queryInterface.addIndex('system_users', ['isActive'], {
    //   name: 'system_users_isActive_idx'
    // });

    // Create initial admin user
    const bcrypt = require('bcryptjs');
    const adminPassword = await bcrypt.hash('Admin123!', 10);
    const uuid = require('uuid');

    await queryInterface.bulkInsert('system_users', [{
      id: uuid.v4(),
      username: 'admin',
      email: 'admin@hakika.com',
      password: adminPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'admin',
      department: 'IT',
      country: 'Ghana',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('system_users');
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS enum_system_users_role;
    `);
  }
};