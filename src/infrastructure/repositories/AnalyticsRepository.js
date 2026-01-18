const IAnalyticsRepository = require('../../domain/interfaces/IAnalyticsRepository');
const { Sequelize, Op } = require('sequelize');
const sequelize = require('../../../config/database')
const Verification = require('../database/models/Verification');
const User = require('../database/models/User');
const Institution = require('../database/models/system/Institution');
const Transaction = require('../database/models/Transaction');

class AnalyticsRepository extends IAnalyticsRepository {
    async getUserAnalytics(userId, period = 'monthly') {
        const dateRange = this.getDateRange(period);

        const verifications = await Verification.findAll({
            include: [{
                model: Institution,
                as: 'institution', // Use the alias defined in Verification model
                attributes: ['name', 'code', 'country'] // Only select needed fields
            }],
            order: [['created_at', 'DESC']]
        });

        const transactions = await Transaction.findAll({
            where: {
                userId,
                status: 'completed',
                createdAt: {
                    [Op.between]: [dateRange.start, dateRange.end]
                }
            }
        });

        const institutionBreakdown = {};
        let totalSpent = 0;

        verifications.forEach(verification => {
            const institutionName = verification.Institution.name;
            institutionBreakdown[institutionName] = (institutionBreakdown[institutionName] || 0) + 1;
        });

        transactions.forEach(transaction => {
            if (transaction.type === 'verification_fee') {
                totalSpent += Math.abs(parseFloat(transaction.amount));
            }
        });

        return {
            totalVerifications: verifications.length,
            completedVerifications: verifications.filter(v => v.status === 'completed').length,
            pendingVerifications: verifications.filter(v =>
                ['pending', 'pending_assignment', 'processing', 'requires_review'].includes(v.status)
            ).length,
            totalSpent,
            institutionBreakdown,
            period
        };
    }

    async getAdminStats() {
        const totalUsers = await User.count();
        const activeUsers = await User.count({
            where: {
                isVerified: true,
                lastLogin: {
                    [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
                }
            }
        });

        const totalVerifications = await Verification.count();
        const pendingVerifications = await Verification.count({
            where: {
                status: ['pending', 'pending_assignment', 'processing', 'requires_review']
            }
        });
        const completedVerifications = await Verification.count({
            where: { status: 'completed' }
        });

        const revenueResult = await Transaction.findOne({
            where: {
                type: 'verification_fee',
                status: 'completed'
            },
            attributes: [
                [Sequelize.fn('SUM', Sequelize.literal('ABS(amount)')), 'totalRevenue']
            ],
            raw: true
        });

        const popularInstitutions = await Verification.findAll({
            attributes: [
                'institutionId',
                [Sequelize.fn('COUNT', Sequelize.col('institutionId')), 'verificationCount']
            ],
            include: [{
                model: Institution,
                attributes: ['name']
            }],
            group: ['institutionId', 'Institution.name'],
            order: [[Sequelize.literal('verificationCount'), 'DESC']],
            limit: 5
        });

        const verificationTrends = await this.getVerificationTrends(7);

        return {
            totalUsers,
            activeUsers,
            totalVerifications,
            pendingVerifications,
            completedVerifications,
            totalRevenue: parseFloat(revenueResult?.totalRevenue || 0),
            popularInstitutions: popularInstitutions.map(inst => ({
                name: inst.Institution.name,
                count: inst.dataValues.verificationCount
            })),
            verificationTrends,
            systemHealth: await this.getSystemHealth()
        };
    }

    async getVerificationTrends(days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const trends = await Verification.findAll({
            attributes: [
                [Sequelize.fn('DATE', Sequelize.col('createdAt')), 'date'],
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
            ],
            where: {
                createdAt: {
                    [Op.gte]: startDate
                }
            },
            group: [Sequelize.fn('DATE', Sequelize.col('createdAt'))],
            order: [[Sequelize.col('date'), 'ASC']],
            raw: true
        });

        return trends;
    }

    async getRevenueAnalytics(period = 'monthly') {
        const dateRange = this.getDateRange(period);

        const revenue = await Transaction.findAll({
            attributes: [
                [Sequelize.fn('DATE', Sequelize.col('createdAt')), 'date'],
                [Sequelize.fn('SUM', Sequelize.literal('ABS(amount)')), 'revenue']
            ],
            where: {
                type: 'verification_fee',
                status: 'completed',
                createdAt: {
                    [Op.gte]: dateRange.start
                }
            },
            group: [Sequelize.fn('DATE', Sequelize.col('createdAt'))],
            order: [[Sequelize.col('date'), 'ASC']],
            raw: true
        });

        return revenue;
    }

    async getSystemHealth() {
        const pendingCount = await Verification.count({
            where: {
                status: ['pending', 'pending_assignment']
            }
        });

        const processingCount = await Verification.count({
            where: { status: 'processing' }
        });

        const failedPayments = await Transaction.count({
            where: {
                status: 'failed',
                createdAt: {
                    [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                }
            }
        });

        return {
            pendingVerifications: pendingCount,
            processingVerifications: processingCount,
            failedPaymentsLast24h: failedPayments,
            overallHealth: pendingCount > 100 ? 'warning' : 'healthy'
        };
    }

    getDateRange(period) {
        const end = new Date();
        const start = new Date();

        switch (period) {
            case 'daily':
                start.setDate(start.getDate() - 1);
                break;
            case 'weekly':
                start.setDate(start.getDate() - 7);
                break;
            case 'monthly':
                start.setMonth(start.getMonth() - 1);
                break;
            case 'yearly':
                start.setFullYear(start.getFullYear() - 1);
                break;
            default:
                start.setMonth(start.getMonth() - 1);
        }

        return { start, end };
    }
}

module.exports = AnalyticsRepository;