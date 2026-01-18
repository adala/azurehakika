const { DataTypes } = require('sequelize');
const sequelize = require('../../../../config/database');

const ApiInstitutionConfig = sequelize.define('ApiInstitutionConfig', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    institutionId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'institutions',
            key: 'id'
        },
        unique: true
    },
    apiEndpoint: {
        type: DataTypes.STRING,
        allowNull: false
    },
    apiKey: {
        type: DataTypes.STRING,
        allowNull: false
    },
    apiSecret: {
        type: DataTypes.STRING,
        allowNull: true
    },
    authMethod: {
        type: DataTypes.ENUM('api_key', 'bearer', 'basic', 'oauth'),
        defaultValue: 'api_key'
    },
    requestFormat: {
        type: DataTypes.ENUM('json', 'xml', 'form'),
        defaultValue: 'json'
    },
    responseFormat: {
        type: DataTypes.ENUM('json', 'xml'),
        defaultValue: 'json'
    },
    timeout: {
        type: DataTypes.INTEGER,
        defaultValue: 30000
    },
    retryAttempts: {
        type: DataTypes.INTEGER,
        defaultValue: 3
    },
    headers: {
        type: DataTypes.JSONB,
        defaultValue: {}
    },
    requestTemplate: {
        type: DataTypes.JSONB,
        defaultValue: {}
    },
    validationRules: {
        type: DataTypes.JSONB,
        defaultValue: {}
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    lastTestedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    lastSuccessAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    failureCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'api_institution_configs',
    timestamps: true
});

ApiInstitutionConfig.associate = (models) => {
    ApiInstitutionConfig.belongsTo(models.Institution, {
        foreignKey: 'institutionId',
        as: 'institution'
    });
};

module.exports = ApiInstitutionConfig;