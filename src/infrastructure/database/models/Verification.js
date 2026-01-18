// infrastructure/database/models/Verification.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../../../config/database');

const Verification = sequelize.define('Verification', {
    // ... all your fields (keep them as is)
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'userId',
        references: {
            model: 'users',
            key: 'id'
        }
    },
    institutionId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'institutions',
            key: 'id'
        }
    },
    // ... rest of your fields
    firstName: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    lastName: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    maidenName: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    dateOfBirth: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    courseName: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    fieldOfStudy: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    degreeType: {
        type: DataTypes.ENUM('Bachelor\'s', 'Master\'s', 'PhD', 'Associate', 'Diploma', 'Certificate', 'Foundation', 'Other'),
        allowNull: false,
    },
    classification: {
        type: DataTypes.ENUM('1st', '2:1', '2:2', '3rd', 'Pass', 'Distinction', 'Merit', 'Credit', 'Other'),
        allowNull: true
    },
    graduationYear: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    studentId: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    additionalNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    certificateFile: {
        type: DataTypes.STRING(500),
        allowNull: false,
    },
    consentFile: {
        type: DataTypes.STRING(500),
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('pending', 'pending_assignment', 'requires_review', 'under_review', 'processing', 'completed', 'failed'),
        defaultValue: 'pending'
    },
    process: {
        type: DataTypes.ENUM('auto', 'manual'),
        defaultValue: 'manual'
    },
    fee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    aiAgentResponse: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    referenceNumber: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: true,
    },
    estimatedCompletionDate: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    priority: {
        type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
        defaultValue: 'normal'
    },
    verificationScore: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
    },
    processingStartedAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    processingEndedAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    tableName: 'verifications',
    timestamps: true,
    underscored: false,
    freezeTableName: true,
    name: {
        singular: 'Verification',
        plural: 'Verifications'
    },
    indexes: [
        {
            fields: ['userId']
        },
        {
            fields: ['institutionId']
        },
        {
            fields: ['status']
        },
        {
            fields: ['referenceNumber'],
            unique: true
        },
        {
            fields: ['graduationYear']
        },
        {
            fields: ['courseName']
        },
        {
            fields: ['degreeType']
        },
        {
            fields: ['classification']
        },
        {
            fields: ['status', 'process']
        },
        {
            fields: ['firstName', 'lastName']
        },
        {
            fields: ['courseName', 'graduationYear']
        }
    ],
    hooks: {
        beforeValidate: (verification) => {
            if (!verification.referenceNumber) {
                verification.referenceNumber = generateReferenceNumber();
            }

            if (!verification.estimatedCompletionDate) {
                const completionDate = new Date();
                if (verification.process === 'auto') {
                    completionDate.setDate(completionDate.getDate() + 2);
                } else {
                    completionDate.setDate(completionDate.getDate() + 14);
                }
                verification.estimatedCompletionDate = completionDate;
            }
        },
        beforeCreate: (verification) => {
            if (verification.dateOfBirth && verification.graduationYear) {
                const dob = new Date(verification.dateOfBirth);
                const graduationDate = new Date(verification.graduationYear, 5, 1);
                const ageAtGraduation = graduationDate.getFullYear() - dob.getFullYear();
                const monthDiff = graduationDate.getMonth() - dob.getMonth();

                let adjustedAge = ageAtGraduation;
                if (monthDiff < 0 || (monthDiff === 0 && graduationDate.getDate() < dob.getDate())) {
                    adjustedAge--;
                }

                if (adjustedAge < 16) {
                    throw new Error('Student must be at least 16 years old at time of graduation');
                }
            }
        }
    }
});


// Instance methods
Verification.prototype.getFullName = function () {
    return `${this.firstName} ${this.lastName}`.trim();
};

Verification.prototype.getAge = function () {
    if (!this.dateOfBirth) return null;
    const dob = new Date(this.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
    }

    return age;
};

Verification.prototype.getFormattedClassification = function () {
    if (!this.classification) return null;

    const classificationMap = {
        '1st': 'First Class Honours',
        '2:1': 'Upper Second Class (2:1)',
        '2:2': 'Lower Second Class (2:2)',
        '3rd': 'Third Class',
        'Pass': 'Pass',
        'Distinction': 'Distinction',
        'Merit': 'Merit',
        'Credit': 'Credit',
        'Other': 'Other'
    };

    return classificationMap[this.classification] || this.classification;
};

Verification.prototype.canProcessAutomatically = function () {
    return this.process === 'auto' ||
        (this.graduationYear >= 2000 &&
            this.certificateFile &&
            this.consentFile);
};

Verification.prototype.updateStatus = function (newStatus, aiResponse = null) {
    this.status = newStatus;
    this.updatedAt = new Date();

    if (aiResponse) {
        this.aiAgentResponse = aiResponse;
    }

    return this.save();
};

// Static methods
Verification.generateReferenceNumber = function () {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `VER-${timestamp}-${random}`;
};

function generateReferenceNumber() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `VER-${timestamp}-${random}`;
}


module.exports = Verification;

// Association
const User = require('./User');
Verification.belongsTo(User, { foreignKey: 'userId' });

const InstitutionResponse = require('./InstitutionResponse');
Verification.hasOne(InstitutionResponse, { foriegnKey: 'verificationId', as: 'verification' });


Object.defineProperty(Verification, 'Institution', {
    get() {
        return require('./system/Institution');
    }
});

// Lazy association
setImmediate(() => {
    if (Verification.Institution) {
        Verification.belongsTo(Verification.Institution, {
            foreignKey: 'institutionId'
        });
    }
});
