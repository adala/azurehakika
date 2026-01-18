const IBulkVerificationRepository = require('../../domain/interfaces/IBulkVerificationRepository');
const BulkVerification = require('../database/models/BulkVerification');
const { Sequelize, Op } = require('sequelize');

class BulkVerificationRepository extends IBulkVerificationRepository {
    async create(bulkVerificationData) {
        return await BulkVerification.create(bulkVerificationData);
    }

    async findById(id) {
        return await BulkVerification.findByPk(id, {
            include: [{
                association: 'User',
                attributes: ['firstName', 'surname', 'email', 'companyName']
            }]
        });
    }

    async findByUserId(userId, limit = 20) {
        return await BulkVerification.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
            limit: limit || 20,
            include: [{
                association: 'User',
                attributes: ['firstName', 'surname', 'email']
            }]
        });
    }

    async updateProgress(id, processedRecords) {
        const [affectedCount] = await BulkVerification.update(
            { processedRecords },
            { where: { id } }
        );

        if (affectedCount === 0) {
            throw new Error('Bulk verification not found');
        }

        return await this.findById(id);
    }

    async updateStatus(id, status) {
        const [affectedCount] = await BulkVerification.update(
            { status },
            { where: { id } }
        );

        if (affectedCount === 0) {
            throw new Error('Bulk verification not found');
        }

        return await this.findById(id);
    }

    async addResult(id, result) {
        const bulkVerification = await this.findById(id);
        if (!bulkVerification) {
            throw new Error('Bulk verification not found');
        }

        const results = bulkVerification.results || [];
        results.push(result);

        const [affectedCount] = await BulkVerification.update(
            { results },
            { where: { id } }
        );

        if (affectedCount === 0) {
            throw new Error('Failed to add result');
        }

        return await this.findById(id);
    }

    async incrementSuccessCount(id) {
        const bulkVerification = await this.findById(id);
        if (!bulkVerification) {
            throw new Error('Bulk verification not found');
        }

        const [affectedCount] = await BulkVerification.update(
            {
                successfulVerifications: Sequelize.literal('successfulVerifications + 1'),
                processedRecords: Sequelize.literal('processedRecords + 1')
            },
            { where: { id } }
        );

        if (affectedCount === 0) {
            throw new Error('Failed to increment success count');
        }

        return await this.findById(id);
    }

    async incrementFailedCount(id) {
        const bulkVerification = await this.findById(id);
        if (!bulkVerification) {
            throw new Error('Bulk verification not found');
        }

        const [affectedCount] = await BulkVerification.update(
            {
                failedVerifications: Sequelize.literal('failedVerifications + 1'),
                processedRecords: Sequelize.literal('processedRecords + 1')
            },
            { where: { id } }
        );

        if (affectedCount === 0) {
            throw new Error('Failed to increment failed count');
        }

        return await this.findById(id);
    }

    async getBulkStats(userId) {
        const stats = await BulkVerification.findOne({
            where: { userId },
            attributes: [
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'totalBulkJobs'],
                [Sequelize.fn('SUM', Sequelize.col('totalRecords')), 'totalRecordsProcessed'],
                [Sequelize.fn('SUM', Sequelize.col('successfulVerifications')), 'totalSuccessful'],
                [Sequelize.fn('SUM', Sequelize.col('failedVerifications')), 'totalFailed'],
                [Sequelize.fn('AVG', Sequelize.col('successfulVerifications')), 'averageSuccessRate']
            ],
            raw: true
        });

        const recentJobs = await this.findByUserId(userId, 5);

        const statusBreakdown = await BulkVerification.findAll({
            where: { userId },
            attributes: [
                'status',
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
            ],
            group: ['status'],
            raw: true
        });

        return {
            totalBulkJobs: parseInt(stats?.totalBulkJobs || 0),
            totalRecordsProcessed: parseInt(stats?.totalRecordsProcessed || 0),
            totalSuccessful: parseInt(stats?.totalSuccessful || 0),
            totalFailed: parseInt(stats?.totalFailed || 0),
            averageSuccessRate: parseFloat(stats?.averageSuccessRate || 0),
            recentJobs: recentJobs.map(job => job.toJSON()),
            statusBreakdown: statusBreakdown.reduce((acc, item) => {
                acc[item.status] = parseInt(item.count);
                return acc;
            }, {})
        };
    }

    async findPendingBulkVerifications() {
        return await BulkVerification.findAll({
            where: {
                status: ['pending', 'processing']
            },
            order: [['createdAt', 'ASC']],
            include: [{
                association: 'User',
                attributes: ['firstName', 'surname', 'email', 'companyName']
            }]
        });
    }

    async deleteBulkVerification(id) {
        const affectedCount = await BulkVerification.destroy({
            where: { id }
        });

        if (affectedCount === 0) {
            throw new Error('Bulk verification not found');
        }

        return true;
    }

    async searchBulkVerifications(userId, criteria) {
        const { status, startDate, endDate, minRecords, maxRecords } = criteria;

        const whereClause = { userId };

        if (status) whereClause.status = status;

        if (startDate || endDate) {
            whereClause.createdAt = {};
            if (startDate) whereClause.createdAt[Op.gte] = startDate;
            if (endDate) whereClause.createdAt[Op.lte] = endDate;
        }

        if (minRecords !== undefined || maxRecords !== undefined) {
            whereClause.totalRecords = {};
            if (minRecords !== undefined) whereClause.totalRecords[Op.gte] = minRecords;
            if (maxRecords !== undefined) whereClause.totalRecords[Op.lte] = maxRecords;
        }

        return await BulkVerification.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
            limit: 50,
            include: [{
                association: 'User',
                attributes: ['firstName', 'surname', 'email']
            }]
        });
    }

    async updateBulkVerification(id, updateData) {
        const [affectedCount] = await BulkVerification.update(
            updateData,
            { where: { id } }
        );

        if (affectedCount === 0) {
            throw new Error('Bulk verification not found');
        }

        return await this.findById(id);
    }

    async getBulkVerificationWithResults(id) {
        return await BulkVerification.findByPk(id, {
            include: [{
                association: 'User',
                attributes: ['firstName', 'surname', 'email', 'companyName']
            }]
        });
    }

    async getRecentBulkVerifications(days = 7) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        return await BulkVerification.findAll({
            where: {
                createdAt: {
                    [Op.gte]: startDate
                }
            },
            order: [['createdAt', 'DESC']],
            limit: 100,
            include: [{
                association: 'User',
                attributes: ['firstName', 'surname', 'email', 'companyName']
            }]
        });
    }

    async getBulkVerificationSummary(userId) {
        const summary = await BulkVerification.findAll({
            where: { userId },
            attributes: [
                'status',
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
                [Sequelize.fn('SUM', Sequelize.col('totalRecords')), 'totalRecords'],
                [Sequelize.fn('SUM', Sequelize.col('successfulVerifications')), 'successfulRecords'],
                [Sequelize.fn('SUM', Sequelize.col('failedVerifications')), 'failedRecords']
            ],
            group: ['status'],
            raw: true
        });

        const totalStats = await BulkVerification.findOne({
            where: { userId },
            attributes: [
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'totalJobs'],
                [Sequelize.fn('SUM', Sequelize.col('totalRecords')), 'allRecords'],
                [Sequelize.fn('SUM', Sequelize.col('successfulVerifications')), 'allSuccessful'],
                [Sequelize.fn('SUM', Sequelize.col('failedVerifications')), 'allFailed']
            ],
            raw: true
        });

        return {
            byStatus: summary.reduce((acc, item) => {
                acc[item.status] = {
                    count: parseInt(item.count),
                    totalRecords: parseInt(item.totalRecords),
                    successfulRecords: parseInt(item.successfulRecords),
                    failedRecords: parseInt(item.failedRecords)
                };
                return acc;
            }, {}),
            overall: {
                totalJobs: parseInt(totalStats?.totalJobs || 0),
                allRecords: parseInt(totalStats?.allRecords || 0),
                allSuccessful: parseInt(totalStats?.allSuccessful || 0),
                allFailed: parseInt(totalStats?.allFailed || 0),
                successRate: totalStats?.allRecords ?
                    (parseInt(totalStats.allSuccessful) / parseInt(totalStats.allRecords)) * 100 : 0
            }
        };
    }
}

module.exports = BulkVerificationRepository;