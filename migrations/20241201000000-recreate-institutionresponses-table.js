'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, drop the existing table if it exists
    await queryInterface.dropTable('institutionresponses');

    // Create the new table
    await queryInterface.createTable('institutionresponses', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      verificationId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'verifications',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      institutionId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'institutions',
          key: 'id'
        }
      },
      requestId: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'External request/reference ID from institution'
      },
      responseData: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      verificationScore: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
          max: 100
        }
      },
      status: {
        type: Sequelize.ENUM(
          'pending',
          'processing', 
          'completed',
          'failed',
          'requires_review',
          'discrepancy'
        ),
        defaultValue: 'pending',
        allowNull: false
      },
      responseType: {
        type: Sequelize.ENUM('manual', 'api_auto', 'api_manual'),
        defaultValue: 'manual',
        allowNull: false,
        comment: 'How the response was obtained'
      },
      processedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      processedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      rawResponse: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      confidenceScore: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
          max: 100
        }
      },
      flags: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      responseTime: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Response time in milliseconds'
      },
      apiVersion: {
        type: Sequelize.STRING,
        allowNull: true
      },
      dataSource: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Source system/database at institution'
      },
      verificationDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      expiryDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      cost: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: true,
        defaultValue: 'USD'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      attachments: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      },
      isVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      verificationMethod: {
        type: Sequelize.STRING,
        allowNull: true
      },
      dataQualityScore: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 0,
          max: 100
        }
      },
      completenessScore: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 0,
          max: 100
        }
      },
      timelinessScore: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 0,
          max: 100
        }
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
    await queryInterface.addIndex('institutionresponses', ['verificationId'], {
      unique: true,
      name: 'institutionresponses_verificationId_unique'
    });

    await queryInterface.addIndex('institutionresponses', ['institutionId'], {
      name: 'institutionresponses_institutionId_idx'
    });

    await queryInterface.addIndex('institutionresponses', ['status'], {
      name: 'institutionresponses_status_idx'
    });

    await queryInterface.addIndex('institutionresponses', ['requestId'], {
      name: 'institutionresponses_requestId_idx'
    });

    await queryInterface.addIndex('institutionresponses', ['createdAt'], {
      name: 'institutionresponses_createdAt_idx'
    });

    await queryInterface.addIndex('institutionresponses', ['verificationScore'], {
      name: 'institutionresponses_verificationScore_idx'
    });

    await queryInterface.addIndex('institutionresponses', ['isVerified'], {
      name: 'institutionresponses_isVerified_idx'
    });

    await queryInterface.addIndex('institutionresponses', ['responseType'], {
      name: 'institutionresponses_responseType_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // If we need to rollback, we'll drop the table
    await queryInterface.dropTable('institutionresponses');
    
    // Note: In a real scenario, you might want to restore the old table
    // But since we dropped it in the up migration, we can't rollback easily
    console.warn('WARNING: This down migration drops the table. Data will be lost.');
  }
};