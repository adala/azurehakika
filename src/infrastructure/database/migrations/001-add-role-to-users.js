const { DataTypes } = require('sequelize');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('users', 'role', {
            type: DataTypes.ENUM('user', 'admin', 'moderator'),
            defaultValue: 'user',
            allowNull: false
        });

        await queryInterface.addColumn('users', 'last_login', {
            type: DataTypes.DATE,
            allowNull: true
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('users', 'role');
        await queryInterface.removeColumn('users', 'last_login');
    }
};