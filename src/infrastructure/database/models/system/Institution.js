// infrastructure/database/models/Institution.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../../../../config/database');
const Verification = require('../Verification');
const InstitutionResponse = require('../InstitutionResponse');

const Institution = sequelize.define('Institution', {

    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    country: {
        type: DataTypes.STRING,
        allowNull: false
    },
    // ... rest of your fields
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    foundingDate: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    numberOfEmployees: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    numberOfStudents: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    legalName: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    logo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    parentOrganization: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    website: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            isUrl: true
        }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            isEmail: true
        }
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    vfee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    process: {
        type: DataTypes.ENUM('auto', 'manual'),
        allowNull: false,
        defaultValue: 'manual'
    },
    processingTime: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    apiEndpoint: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    apiKey: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    }
}, {
    tableName: 'institutions',
    timestamps: true,
    indexes: [
        {
            fields: ['code']
        },
        {
            fields: ['country']
        },
        {
            fields: ['type']
        },
        {
            fields: ['isActive']
        }
    ]
});

module.exports = Institution; 

// Association
Institution.hasMany(Verification, { foreignKey: 'institutionId' });
Institution.hasMany(InstitutionResponse, { foreignKey: 'institutionId' });


