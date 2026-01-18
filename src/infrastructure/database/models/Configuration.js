const { DataTypes } = require('sequelize');
const sequelize = require('../../../../config/database');

const Configuration = sequelize.define('Configuration', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    key: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    value: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    category: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Category for grouping configurations'
    }
}, {
    tableName: 'configurations',
    timestamps: true,
    indexes: [
        {
            fields: ['key']
        },
        {
            fields: ['category']
        },
        {
            fields: ['isActive']
        }
    ]
});

// Instance methods
Configuration.prototype.getParsedValue = function () {
    try {
        return JSON.parse(this.value);
    } catch (error) {
        return this.value;
    }
};

Configuration.prototype.toJSON = function () {
    const values = { ...this.get() };
    values.parsedValue = this.getParsedValue();
    return values;
};

module.exports = Configuration;