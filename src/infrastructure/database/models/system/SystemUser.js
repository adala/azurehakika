const { DataTypes } = require('sequelize');
const sequelize = require('../../../../../config/database');
const bcrypt = require('bcryptjs');

const SystemUser = sequelize.define('SystemUser', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
            len: [3, 50]
        }
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    firstName: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    lastName: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('admin', 'supervisor', 'worker'),
        defaultValue: 'worker',
        allowNull: false
    },
    department: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    country: {
        type: DataTypes.STRING
    },
    avatar:{
        type: DataTypes.STRING,
        allowNull: false
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    lastLoginAt: {
        type: DataTypes.DATE, 
        allowNull: true
    },
    passwordChangedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    failedLoginAttempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    accountLockedUntil: {
        type: DataTypes.DATE,
        allowNull: true
    },
    mustChangePassword: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'system_users',
    timestamps: true,
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                user.password = await bcrypt.hash(user.password, 10);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                user.password = await bcrypt.hash(user.password, 10);
                user.passwordChangedAt = new Date();
            }
        }
    }
});

// Instance methods
SystemUser.prototype.validatePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

SystemUser.prototype.getFullName = function () {
    return `${this.firstName} ${this.lastName}`;
};

SystemUser.prototype.hasPermission = function (requiredRole) {
    const roleHierarchy = {
        'worker': ['worker'],
        'supervisor': ['worker', 'supervisor'],
        'admin': ['worker', 'supervisor', 'admin']
    };
    return roleHierarchy[this.role]?.includes(requiredRole) || false;
};

module.exports = SystemUser;