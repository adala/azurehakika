// src/infrastructure/database/models/InstitutionResponse.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../../../config/database');

const InstitutionResponse = sequelize.define('InstitutionResponse', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    verificationId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'verifications',
            key: 'id'
        },
        onDelete: 'CASCADE',
        unique: true // One response per verification
    },
    institutionId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'institutions',
            key: 'id'
        }
    },
    requestId: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'External request/reference ID from institution'
    },
    responseData: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
        comment: 'Structured response data from institution'
    },
    verificationScore: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0,
            max: 100
        },
        comment: 'Percentage match between submitted and institution data'
    },
    status: {
        type: DataTypes.ENUM(
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
        type: DataTypes.ENUM('manual', 'api_auto', 'api_manual'),
        defaultValue: 'manual',
        allowNull: false
    },
    processedBy: {
        type: DataTypes.UUID,
        allowNull: true, 
        references: {
            model: 'users',
            key: 'id'
        },
        comment: 'User who processed the response'
    },
    processedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    rawResponse: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Original raw response from institution (JSON, XML, text)'
    },
    confidenceScore: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0,
            max: 100
        },
        comment: 'Confidence in the response accuracy'
    },
    flags: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
        comment: 'Array of flags/issues with the response'
    },
    metadata: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
        comment: 'Additional metadata (response time, API version, etc.)'
    },
    responseTime: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Response time in milliseconds'
    },
    apiVersion: {
        type: DataTypes.STRING,
        allowNull: true
    },
    dataSource: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Source system/database at institution'
    },
    verificationDate: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Date institution verified the record'
    },
    expiryDate: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When this verification response expires'
    },
    cost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Cost charged by institution'
    },
    currency: {
        type: DataTypes.STRING(3),
        allowNull: true,
        defaultValue: 'USD'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    attachments: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
        comment: 'Array of attachment URLs/references'
    },
    isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Whether institution explicitly verified the record'
    },
    verificationMethod: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Method used by institution (database lookup, manual check, etc.)'
    },
    dataQualityScore: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: 0,
            max: 100
        }
    },
    completenessScore: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: 0,
            max: 100
        }
    },
    timelinessScore: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: 0,
            max: 100
        }
    }
}, {
    tableName: 'institutionresponses',
    timestamps: true,
    indexes: [
        {
            fields: ['verificationId'],
            unique: true
        },
        {
            fields: ['institutionId']
        },
        {
            fields: ['status']
        },
        {
            fields: ['requestId']
        },
        {
            fields: ['createdAt']
        },
        {
            fields: ['verificationScore']
        }
    ],
    hooks: {
        beforeCreate: (instance) => {
            if (instance.responseData) {
                // Ensure responseData is always an object
                if (typeof instance.responseData === 'string') {
                    try {
                        instance.responseData = JSON.parse(instance.responseData);
                    } catch (error) {
                        instance.responseData = {};
                    }
                }
            }
        }
    }
});

module.exports = InstitutionResponse;

// Associations
const Verification = require('./Verification');
const Institution = require('./system/Institution');
const User = require('./User');

InstitutionResponse.belongsTo(Verification, {
    foreignKey: 'verificationId',
    as: 'verification',
    onDelete: 'CASCADE'
});

Object.defineProperty(InstitutionResponse, 'Institution', {
    get() {
        return require('./system/Institution');
    }
});

// Lazy association
setImmediate(() => { 
    if (InstitutionResponse.Institution) {
        InstitutionResponse.belongsTo(InstitutionResponse.Institution, {
            foreignKey: 'institutionId',
            as: 'institution'
        });
    }
});

InstitutionResponse.belongsTo(User, {
    foreignKey: 'processedBy',
    as: 'processor'
});

