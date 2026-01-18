const ITeamMemberRepository = require('../../domain/interfaces/ITeamMemberRepository');
const TeamMember = require('../database/models/TeamMember');
const User = require('../database/models/User');

class TeamMemberRepository extends ITeamMemberRepository {
    async create(teamMemberData) {
        return await TeamMember.create(teamMemberData);
    }

    async findByTeamId(teamId) {
        return await TeamMember.findAll({
            where: { teamId },
            include: [{
                model: User,
                attributes: ['firstName', 'surname', 'email', 'isVerified']
            }],
            order: [['createdAt', 'DESC']]
        });
    }

    async findByEmailAndTeamId(email, teamId) {
        return await TeamMember.findOne({
            where: { email, teamId },
            include: [{
                model: User,
                attributes: ['firstName', 'surname', 'email', 'isVerified']
            }]
        });
    }

    async findById(id) {
        return await TeamMember.findByPk(id, {
            include: [{
                model: User,
                attributes: ['firstName', 'surname', 'email', 'isVerified']
            }]
        });
    }

    async findByUserId(userId) {
        return await TeamMember.findAll({
            where: { userId },
            include: [{
                model: User,
                as: 'team',
                attributes: ['firstName', 'surname', 'email', 'companyName']
            }]
        });
    }

    async update(id, teamMemberData) {
        const [affectedCount] = await TeamMember.update(teamMemberData, {
            where: { id }
        });

        if (affectedCount === 0) {
            throw new Error('Team member not found');
        }

        return await this.findById(id);
    }

    async delete(id) {
        const affectedCount = await TeamMember.destroy({ where: { id } });

        if (affectedCount === 0) {
            throw new Error('Team member not found');
        }

        return true;
    }

    async activateMember(id, userId) {
        const [affectedCount] = await TeamMember.update(
            { isActive: true, joinedAt: new Date(), userId },
            { where: { id } }
        );

        if (affectedCount === 0) {
            throw new Error('Team member not found');
        }

        return await this.findById(id);
    }

    async updatePermissions(id, permissions) {
        const [affectedCount] = await TeamMember.update(
            { permissions },
            { where: { id } }
        );

        if (affectedCount === 0) {
            throw new Error('Team member not found');
        }

        return await this.findById(id);
    }

    async getTeamMemberCount(teamId) {
        return await TeamMember.count({
            where: {
                teamId,
                isActive: true
            }
        });
    }
}

module.exports = TeamMemberRepository;