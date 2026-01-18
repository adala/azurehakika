const { DataTypes } = require('sequelize');
const sequelize = require('../../../../config/database');

const BulkVerification = sequelize.define('BulkVerification', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    totalRecords: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
            min: 1
        }
    },
    processedRecords: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    successfulVerifications: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    failedVerifications: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    status: {
        type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled'),
        defaultValue: 'pending'
    },
    filePath: {
        type: DataTypes.STRING,
        allowNull: false
    },
    fileOriginalName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    fileSize: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'File size in bytes'
    },
    results: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    metadata: {
        type: DataTypes.JSON,
        defaultValue: {},
        comment: 'Additional metadata like processing options, custom fields, etc.'
    },
    estimatedCost: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        comment: 'Estimated cost for the bulk verification'
    },
    actualCost: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        comment: 'Actual cost deducted from wallet'
    },
    processingStartedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    processingCompletedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    errorLog: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Error logs if processing failed'
    }
}, {
    tableName: 'bulk_verifications',
    timestamps: true,
    indexes: [
        {
            fields: ['userId', 'createdAt']
        },
        {
            fields: ['status']
        },
        {
            fields: ['createdAt']
        }
    ]
});

// Associations
const User = require('./User');
BulkVerification.belongsTo(User, { foreignKey: 'userId' });

// Instance methods
BulkVerification.prototype.startProcessing = function () {
    this.status = 'processing';
    this.processingStartedAt = new Date();
    return this.save();
};

BulkVerification.prototype.completeProcessing = function () {
    this.status = 'completed';
    this.processingCompletedAt = new Date();
    return this.save();
};

BulkVerification.prototype.failProcessing = function (error) {
    this.status = 'failed';
    this.errorLog = error;
    this.processingCompletedAt = new Date();
    return this.save();
};

BulkVerification.prototype.cancelProcessing = function () {
    this.status = 'cancelled';
    this.processingCompletedAt = new Date();
    return this.save();
};

BulkVerification.prototype.getProgress = function () {
    if (this.totalRecords === 0) return 0;
    return (this.processedRecords / this.totalRecords) * 100;
};

BulkVerification.prototype.getSuccessRate = function () {
    if (this.processedRecords === 0) return 0;
    return (this.successfulVerifications / this.processedRecords) * 100;
};

BulkVerification.prototype.toJSON = function () {
    const values = { ...this.get() };

    // Calculate derived properties
    values.progress = this.getProgress();
    values.successRate = this.getSuccessRate();
    values.remainingRecords = this.totalRecords - this.processedRecords;
    values.isProcessing = this.status === 'processing';
    values.isCompleted = this.status === 'completed';
    values.isFailed = this.status === 'failed';

    // Format dates
    values.formattedCreatedAt = this.createdAt.toLocaleString();
    if (this.processingStartedAt) {
        values.formattedProcessingStartedAt = this.processingStartedAt.toLocaleString();
    }
    if (this.processingCompletedAt) {
        values.formattedProcessingCompletedAt = this.processingCompletedAt.toLocaleString();
    }

    // Calculate processing time
    if (this.processingStartedAt && this.processingCompletedAt) {
        const processingTime = this.processingCompletedAt - this.processingStartedAt;
        values.processingTimeSeconds = Math.round(processingTime / 1000);
        values.formattedProcessingTime = this.formatProcessingTime(processingTime);
    }

    // File size formatting
    if (this.fileSize) {
        values.formattedFileSize = this.formatFileSize(this.fileSize);
    }

    return values;
};

BulkVerification.prototype.formatProcessingTime = function (milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
};

BulkVerification.prototype.formatFileSize = function (bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Static methods
BulkVerification.getStatusCounts = async function (userId) {
    const counts = await BulkVerification.findAll({
        where: { userId },
        attributes: [
            'status',
            [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status'],
        raw: true
    });

    return counts.reduce((acc, item) => {
        acc[item.status] = parseInt(item.count);
        return acc;
    }, {});
};

BulkVerification.getTotalCost = async function (userId) {
    const result = await BulkVerification.findOne({
        where: { userId },
        attributes: [
            [sequelize.fn('SUM', sequelize.col('actualCost')), 'totalCost']
        ],
        raw: true
    });

    return parseFloat(result?.totalCost || 0);
};

module.exports = BulkVerification;