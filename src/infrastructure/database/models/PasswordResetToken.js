// models/PasswordResetToken.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const PasswordResetToken = sequelize.define('PasswordResetToken', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            },
            onDelete: 'CASCADE',
            field: 'user_id'
        },
        token: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: false,
            field: 'expires_at'
        },
        used: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: 'created_at'
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: 'updated_at'
        }
    }, {
        tableName: 'password_reset_tokens',
        underscored: true,
        indexes: [
            {
                fields: ['token']
            },
            {
                fields: ['user_id']
            },
            {
                fields: ['expires_at']
            }
        ]
    });

    PasswordResetToken.associate = function (models) {
        PasswordResetToken.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
    };

    return PasswordResetToken;
};