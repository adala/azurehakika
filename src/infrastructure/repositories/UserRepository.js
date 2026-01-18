const IUserRepository = require('../../domain/interfaces/IUserRepository');
const User = require('../database/models/User');

class UserRepository extends IUserRepository {
    async create(userData) {
        const user = await User.create(userData);
        return user;
    }

    async findByEmail(email) {
        const user = await User.findOne({ where: { email } });
        return user;
    }

    async findTeamMembers(company) {
        const user = await User.findAll({
            where: {
                companyName: company,
                role: 'member'
            },
            order: [['surname', 'ASC']]
        });
        return user;
    }

    async findById(id) {
        const user = await User.findByPk(id);
        return user;
    }

    async activateMember(id) {
        return this.update(id, { isVerified: true })
    }

    async update(id, userData) {
        const [affectedCount] = await User.update(userData, { where: { id } });

        if (affectedCount === 0) {
            throw new Error('User not found');
        }

        return await this.findById(id);
    }

    async delete(id) {
        const affectedCount = await User.destroy({ where: { id } });

        if (affectedCount === 0) {
            throw new Error('User not found');
        }

        return true;
    }
}

module.exports = UserRepository;