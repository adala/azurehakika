// infrastructure/repositories/VerificationRepository.js
const sequelize = require('../../../config/database');
const { Op } = require('sequelize');

const IVerificationRepository = require('../../domain/interfaces/IVerificationRepository');
const Verification = require('../../infrastructure/database/models/Verification');
const Institution = require('../database/models/system/Institution');
const InstitutionResponse = require('../../infrastructure/database/models/InstitutionResponse');

class VerificationRepository extends IVerificationRepository {
    async create(verificationData) {
        try {
            console.log('Creating verification with data:', {
                ...verificationData,
                certificateFile: '[FILE]',
                consentFile: '[FILE]'
            });

            const verification = await Verification.create(verificationData);
            console.log('Verification created with ID:', verification.id);
            return verification;
        } catch (error) {
            console.error('Error creating verification:', error);
            throw error;
        }
    }

    async findByUserId(userId) {
        return await Verification.findAll({
            where: { userId },
            include: [{
                model: Institution,
                attributes: ['id', 'name', 'code', 'country', 'type', 'vfee', 'logo']
            }],
            order: [['createdAt', 'DESC']]
        });
    }

    async findById(userId, id,) {
        const verification = await Verification.findByPk(id, {
            where: { userId },
            include: [{
                model: Institution,
                attributes: ['id', 'name', 'email', 'website', 'code', 'country', 'type', 'processingTime', 'logo', 'vfee']
            },
            {
                model: InstitutionResponse,
                as: 'verification'
            }]
        });

        return verification ? verification.get({ plain: true }) : null;
    }

    async updateStatus(id, status, aiAgentResponse = null) {
        const updateData = { status };

        if (aiAgentResponse) {
            updateData.aiAgentResponse = aiAgentResponse;
            updateData.processedAt = new Date();
        }

        const [affectedCount] = await Verification.update(
            updateData,
            { where: { id } }
        );

        if (affectedCount === 0) {
            throw new Error('Verification not found');
        }

        return await this.findById(id);
    }


    async updateProcess(id, process) {
        const [affectedCount] = await Verification.update(
            { process },
            { where: { id } }
        );

        if (affectedCount === 0) {
            throw new Error('Verification record not found');
        }

        return await this.findById(id);
    }

    async findByStatus(userId, status) {
        return await Verification.findAll({
            where: { userId, status },
            include: [{
                model: Institution,
                attributes: ['name', 'country']
            }],
            order: [['createdAt', 'DESC']]
        });
    }

    async findByProcess(process) {
        return await Verification.findAll({
            where: { process },
            order: [['createdAt', 'DESC']]
        });
    }

    async findByCourseName(courseName) {
        return await Verification.findAll({
            where: { courseName },
            include: [{
                model: Institution,
                attributes: ['name', 'country']
            }],
            order: [['createdAt', 'DESC']]
        });
    }

    async findByDegreeType(degreeType) {
        return await Verification.findAll({
            where: { degreeType },
            include: [{
                model: Institution,
                attributes: ['name', 'country']
            }],
            order: [['createdAt', 'DESC']]
        });
    }

    async findByClassification(classification) {
        return await Verification.findAll({
            where: { classification },
            include: [{
                model: Institution,
                attributes: ['name', 'country']
            }],
            order: [['createdAt', 'DESC']]
        });
    }

    async generateReferenceNumber() {
        const timestamp = Date.now().toString();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `VER${timestamp}${random}`;
    }

    async count() {
        return await Verification.count();
    }

    async countByStatus(status) {
        return await Verification.count({
            where: { status }
        });
    }

    async countByProcess(process) {
        return await Verification.count({
            include: [{
                model: Institution,
                where: { process: process }
            }]
        });
    }

    async countSuccessful() {
        return await Verification.count({
            where: {
                verificationScore: { [Op.gte]: 80 }
            }
        });
    }

    async countFailed() {
        return await Verification.count({
            where: {
                verificationScore: { [Op.lt]: 80 }
            }
        });
    }

    async getStatusDistribution() {
        const result = await Verification.findAll({
            attributes: [
                'status',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['status'],
            raw: true
        });

        return result.reduce((acc, row) => {
            acc[row.status] = parseInt(row.count);
            return acc;
        }, {});
    }

    async getMonthlyTrend(months = 6) {
        const date = new Date();
        date.setMonth(date.getMonth() - months);

        return await Verification.findAll({
            attributes: [
                [sequelize.fn('date_trunc', 'month', sequelize.col('createdAt')), 'month'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            where: {
                createdAt: { [Op.gte]: date }
            },
            group: sequelize.fn('date_trunc', 'month', sequelize.col('createdAt')),
            order: [[sequelize.fn('date_trunc', 'month', sequelize.col('createdAt')), 'ASC']],
            raw: true
        });
    }
}

module.exports = VerificationRepository;