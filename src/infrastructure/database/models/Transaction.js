const { DataTypes } = require('sequelize');
const sequelize = require('../../../../config/database');
const Verification = require('../models/Verification');

const Transaction = sequelize.define('Transaction', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    type: {
        type: DataTypes.ENUM('topup', 'verification_fee', 'refund', 'withdrawal'),
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    currency: {
        type: DataTypes.STRING,
        defaultValue: 'USD'
    },
    reference: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    paymentMethod: {
        type: DataTypes.ENUM('momo', 'card', 'bank_transfer', 'wallet'),
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
        defaultValue: 'pending'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    metadata: {
        type: DataTypes.JSON,
        allowNull: true
    },
    processedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    failureReason: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'transactions',
    timestamps: true,
    indexes: [
        {
            fields: ['userId', 'createdAt']
        },
        {
            fields: ['reference']
        },
        {
            fields: ['status']
        },
        {
            fields: ['type']
        }
    ]
});

// Associations
const User = require('./User');
Transaction.belongsTo(User, { foreignKey: 'userId' });

// Instance methods
Transaction.prototype.markAsCompleted = function () {
    this.status = 'completed';
    this.processedAt = new Date();
    return this.save();
};

Transaction.prototype.markAsFailed = function (reason) {
    this.status = 'failed';
    this.failureReason = reason;
    return this.save();
};

Transaction.prototype.toJSON = function () {
    const values = { ...this.get() };

    // Format amount based on type
    if (values.type === 'verification_fee') {
        values.formattedAmount = `-$${Math.abs(parseFloat(values.amount)).toFixed(2)}`;
        values.amountType = 'debit';
    } else {
        values.formattedAmount = `+$${parseFloat(values.amount).toFixed(2)}`;
        values.amountType = 'credit';
    }

    // Format dates
    values.formattedCreatedAt = values.createdAt.toLocaleDateString();
    if (values.processedAt) {
        values.formattedProcessedAt = values.processedAt.toLocaleDateString();
    }

    return values;
};

module.exports = Transaction;