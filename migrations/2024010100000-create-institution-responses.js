// migrations/20240101000000-create-institution-responses.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('institutionresponses', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      verificationId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'verifications',
          key: 'id'
        },
        onDelete: 'CASCADE',
        unique: true
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
        allowNull: true
      },
      responseData: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      verificationScore: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      status: {
        type: Sequelize.ENUM('pending', 'processing', 'completed', 'failed', 'requires_review', 'discrepancy'),
        defaultValue: 'pending',
        allowNull: false
      },
      responseType: {
        type: Sequelize.ENUM('manual', 'api_auto', 'api_manual'),
        defaultValue: 'manual',
        allowNull: false
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
        defaultValue: 0
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
        allowNull: true
      },
      apiVersion: {
        type: Sequelize.STRING,
        allowNull: true
      },
      dataSource: {
        type: Sequelize.STRING,
        allowNull: true
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
        allowNull: true
      },
      completenessScore: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      timelinessScore: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create indexes
    await queryInterface.addIndex('institutionresponses', ['verificationId'], {
      unique: true,
      name: 'idx_institution_responses_verification_id'
    });

    await queryInterface.addIndex('institutionresponses', ['institutionId'], {
      name: 'idx_institution_responses_institution_id'
    });

    await queryInterface.addIndex('institutionresponses', ['status'], {
      name: 'idx_institution_responses_status'
    });

    await queryInterface.addIndex('institutionresponses', ['requestId'], {
      name: 'idx_institution_responses_request_id'
    });

    await queryInterface.addIndex('institutionresponses', ['createdAt'], {
      name: 'idx_institution_responses_created_at'
    });

    await queryInterface.addIndex('institutionresponses', ['verificationScore'], {
      name: 'idx_institution_responses_verification_score'
    });

    // Add foreign key constraints
    await queryInterface.addConstraint('institutionresponses', {
      fields: ['verificationId'],
      type: 'foreign key',
      name: 'fk_institution_responses_verification_id',
      references: {
        table: 'verifications',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('institutionresponses', {
      fields: ['institutionId'],
      type: 'foreign key',
      name: 'fk_institution_responses_institution_id',
      references: {
        table: 'institutions',
        field: 'id'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('institutionresponses', {
      fields: ['processedBy'],
      type: 'foreign key',
      name: 'fk_institution_responses_processed_by',
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('institutionresponses', 'fk_institution_responses_verification_id');
    await queryInterface.removeConstraint('institutionresponses', 'fk_institution_responses_institution_id');
    await queryInterface.removeConstraint('institutionresponses', 'fk_institution_responses_processed_by');
    
    await queryInterface.dropTable('institutionresponses');
  }
};