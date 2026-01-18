const { DataTypes } = require('sequelize');
const sequelize = require('../../../../config/database');

const Wallet = sequelize.define('Wallet', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    balance: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    currency: {
        type: DataTypes.STRING,
        defaultValue: 'USD'
    }
}, {
    tableName: 'wallets',
    timestamps: true
});

module.exports = Wallet;