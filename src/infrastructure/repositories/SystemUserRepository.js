const ISystemUserRepository = require('../../domain/interfaces/ISystemUserRepository');
const SystemUser = require('../database/models/system/SystemUser');
const sequelize = require('../../../config/database');

class SystemUserRepository extends ISystemUserRepository {

    async create(user) {
        const created = await SystemUser.create({
            username: user.username,
            email: user.email,
            password: user.password,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            department: user.department,
            country: user.country,
            isActive: user.isActive
        });
        return created;
    }

    async findByUsername(username) {
        const user = await SystemUser.findOne({
            where: { username, isActive: true }
        });
        return user;
    }

    async update(id, userData) {
        const [affectedCount] = await SystemUser.update(userData, { where: { id } });

        if (affectedCount === 0) {
            throw new Error('User not found');
        }

        return await this.findById(id);
    }

    async findById(id) {
        const user = await SystemUser.findByPk(id);
        return user;
    }

    async findByEmail(email) {
        const user = await SystemUser.findOne({
            where: { email, isActive: true }
        });
        return user;
    }

    async findByCredentials(username, password) {
        const user = await SystemUser.findOne({
            where: { username, isActive: true }
        });

        if (!user) return null;

        const isValid = await user.validatePassword(password);
        return isValid ? user : null;
    }

    async updateLastLogin(id) {
        await SystemUser.update(
            { lastLoginAt: new Date() },
            { where: { id } }
        );
    }

    async incrementFailedAttempts(id) {
        const user = await SystemUser.findByPk(id);
        if (user) {
            const attempts = user.failedLoginAttempts + 1;
            const updates = { failedLoginAttempts: attempts };

            // Lock account after 5 failed attempts for 30 minutes
            if (attempts >= 5) {
                const lockUntil = new Date(Date.now() + 30 * 60 * 1000);
                updates.accountLockedUntil = lockUntil;
            }

            await SystemUser.update(updates, { where: { id } });
        }
    }

    async resetFailedAttempts(id) {
        await SystemUser.update(
            {
                failedLoginAttempts: 0,
                accountLockedUntil: null
            },
            { where: { id } }
        );
    }

    async isAccountLocked(id) {
        const user = await SystemUser.findByPk(id);
        if (!user) return true;

        if (user.accountLockedUntil) {
            return new Date() < user.accountLockedUntil;
        }
        return false;
    }

    async count() {
        return await SystemUser.count();
    }

    async countActive() {
        return await SystemUser.count({
            where: { isActive: true }
        });
    }

    async countByRole() {
        const result = await SystemUser.findAll({
            attributes: [
                'role',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['role'],
            raw: true
        });

        return result.reduce((acc, row) => {
            acc[row.role] = parseInt(row.count);
            return acc;
        }, {});
    }

    async countByRoleAndSupervisor(role, supervisorId) {
        return await SystemUser.count({
            where: {
                role,
                supervisorId,
                isActive: true
            }
        });
    }
}

module.exports = SystemUserRepository;