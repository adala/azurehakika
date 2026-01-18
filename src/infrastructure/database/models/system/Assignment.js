const { DataTypes } = require('sequelize');
const sequelize = require('../../../../../config/database');

const Assignment = sequelize.define('Assignment', {
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
        onDelete: 'CASCADE'
    },
    assigneeId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    assignedBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    assignedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    dueDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
        defaultValue: 'pending',
        allowNull: false
    },
    connectionType: {
        type: DataTypes.ENUM('api', 'manual'),
        allowNull: false
    },
    institutionId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'institutions',
            key: 'id'
        }
    },
    priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'assignments',
    timestamps: true,
    indexes: [
        {
            fields: ['assigneeId', 'status']
        },
        {
            fields: ['verificationId'],
            unique: true
        },
        {
            fields: ['status']
        },
        {
            fields: ['dueDate']
        },
        {
            fields: ['priority']
        }
    ]
});

// Associations
Assignment.associate = (models) => {
    Assignment.belongsTo(models.Verification, {
        foreignKey: 'verificationId',
        as: 'verification'
    });
    
    Assignment.belongsTo(models.User, {
        foreignKey: 'assigneeId',
        as: 'assignee'
    });
    
    Assignment.belongsTo(models.User, {
        foreignKey: 'assignedBy',
        as: 'assigner'
    });
    
    Assignment.belongsTo(models.Institution, {
        foreignKey: 'institutionId',
        as: 'institution'
    });
};

module.exports = Assignment;