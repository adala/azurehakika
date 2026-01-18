const ITransactionRepository = require('../../domain/interfaces/ITransactionRepository');
const Transaction = require('../database/models/Transaction');
const Verification = require('../database/models/Verification');
const { Sequelize, Op } = require('sequelize');

class TransactionRepository extends ITransactionRepository {
    async create(transactionData) {
        return await Transaction.create(transactionData);
    }

    async findAll(filterConditions, limit, offset) {
        return await Transaction.findAll({
            where: filterConditions,
            order: [['createdAt', 'DESC']],
            limit,
            offset,
            include: [
                {
                    model: Verification,
                    as: 'Verification',
                    attributes: ['id', 'referenceNumber'],
                    required: false
                }
            ]
        });
    }

    async findByUserId(userId, limit = 5) {

        return await Transaction.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
            limit: limit || 5
        });
    }

    async getUserTransactionsWithFilters(userId, offset, limit, filters = {}) {
        const {
            status,
            paymentMethod,
            institution,
            search,
            fromDate,
            toDate,
            dateRange = 'week'
        } = filters;

        // Build where clause
        const whereClause = { userId };

        // Apply status filter
        if (status) {
            whereClause.status = status;
        }

        // Apply payment method filter
        if (paymentMethod) {
            whereClause.paymentMethod = paymentMethod;
        }

        // Apply institution filter (assuming transaction has institutionId or similar)
        if (institution) {
            whereClause.institutionId = institution;
        }

        // Apply date range filter
        let dateFilter = {};
        const now = new Date();

        switch (dateRange) {
            case 'today':
                dateFilter = {
                    [Op.gte]: new Date(now.setHours(0, 0, 0, 0)),
                    [Op.lte]: new Date(now.setHours(23, 59, 59, 999))
                };
                break;
            case 'yesterday':
                const yesterday = new Date(now);
                yesterday.setDate(yesterday.getDate() - 1);
                dateFilter = {
                    [Op.gte]: new Date(yesterday.setHours(0, 0, 0, 0)),
                    [Op.lte]: new Date(yesterday.setHours(23, 59, 59, 999))
                };
                break;
            case 'week':
                const startOfWeek = new Date(now);
                const day = startOfWeek.getDay();
                const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
                dateFilter = {
                    [Op.gte]: new Date(startOfWeek.setDate(diff)),
                    [Op.lte]: new Date(now.setHours(23, 59, 59, 999))
                };
                break;
            case 'month':
                dateFilter = {
                    [Op.gte]: new Date(now.getFullYear(), now.getMonth(), 1),
                    [Op.lte]: new Date(now.setHours(23, 59, 59, 999))
                };
                break;
            case 'quarter':
                const quarter = Math.floor((now.getMonth() + 3) / 3);
                const startOfQuarter = new Date(now.getFullYear(), (quarter - 1) * 3, 1);
                const endOfQuarter = new Date(startOfQuarter);
                endOfQuarter.setMonth(endOfQuarter.getMonth() + 3);
                endOfQuarter.setDate(0);
                dateFilter = {
                    [Op.gte]: startOfQuarter,
                    [Op.lte]: new Date(endOfQuarter.setHours(23, 59, 59, 999))
                };
                break;
            case 'year':
                dateFilter = {
                    [Op.gte]: new Date(now.getFullYear(), 0, 1),
                    [Op.lte]: new Date(now.setHours(23, 59, 59, 999))
                };
                break;
            case 'custom':
                if (fromDate && toDate) {
                    dateFilter = {
                        [Op.gte]: new Date(fromDate),
                        [Op.lte]: new Date(toDate + 'T23:59:59.999Z')
                    };
                }
                break;
        }

        if (Object.keys(dateFilter).length > 0) {
            whereClause.createdAt = dateFilter;
        }

        // Apply search filter
        if (search) {
            whereClause[Op.or] = [
                { id: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } },
                { gatewayReference: { [Op.like]: `%${search}%` } },
                { referenceNumber: { [Op.like]: `%${search}%` } }
            ];
        }

        try {
            // Get total count
            const total = await Transaction.count({ where: whereClause });

            // Get paginated data
            const transactions = await Transaction.findAll({
                where: whereClause,
                order: [['createdAt', 'DESC']],
                limit: limit,
                offset: offset,
                // include: [
                //     {
                //         model: Verification,
                //         as: 'Verification',
                //         attributes: ['id', 'referenceNumber', 'institutionName'],
                //         required: false
                //     }
                // ]
            });

            return { transactions, total };
        } catch (error) {
            console.error('Error in getUserTransactionsWithFilters:', error);
            throw error;
        }
    }

    async getUserTransactionStats(userId, filters = {}) {
        const {
            status,
            paymentMethod,
            institution,
            fromDate,
            toDate,
            dateRange = 'month'
        } = filters;

        // Build where clause for stats
        const whereClause = { userId };

        // Apply filters to stats
        if (status && status !== 'all') {
            whereClause.status = status;
        }

        if (paymentMethod && paymentMethod !== 'all') {
            whereClause.paymentMethod = paymentMethod;
        }

        if (institution && institution !== 'all') {
            whereClause.institutionId = institution;
        }

        // Apply date range filter
        let dateFilter = {};
        const now = new Date();

        switch (dateRange) {
            case 'today':
            case 'yesterday':
            case 'week':
            case 'month':
            case 'quarter':
            case 'year':
            case 'custom':
                // Use the same date filter logic as above
                whereClause.createdAt = this.getDateRangeFilter(dateRange, fromDate, toDate);
                break;
        }
        
        try {
            // Get transaction statistics
            const stats = await Transaction.findOne({
                where: whereClause,
                attributes: [
                    [Sequelize.fn('COUNT', Sequelize.col('id')), 'totalTransactions'],
                    [Sequelize.literal(`SUM(CASE WHEN type = 'topup' THEN amount ELSE 0 END)`), 'totalTopups'],
                    [Sequelize.literal(`SUM(CASE WHEN type = 'verification_fee' THEN ABS(amount) ELSE 0 END)`), 'totalSpent'],
                    [Sequelize.literal(`COUNT(CASE WHEN type = 'verification_fee' THEN 1 END)`), 'verificationCount'],
                    [Sequelize.fn('SUM', Sequelize.col('amount')), 'currentBalance']
                ],
                raw: true
            });

            // Get status distribution
            const statusStats = await Transaction.findAll({
                where: whereClause,
                attributes: [
                    'status',
                    [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
                    [Sequelize.fn('SUM', Sequelize.col('amount')), 'totalAmount']
                ],
                group: ['status'],
                raw: true
            });

            // Format status distribution
            const statusDistribution = {};
            statusStats.forEach(stat => {
                statusDistribution[stat.status] = {
                    count: parseInt(stat.count || 0),
                    amount: parseFloat(stat.totalAmount || 0)
                };
            });

            // Get counts by type
            const typeStats = await Transaction.findAll({
                where: whereClause,
                attributes: [
                    'type',
                    [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
                    [Sequelize.fn('SUM', Sequelize.literal('ABS(amount)')), 'totalAmount']
                ],
                group: ['type'],
                raw: true
            });

            // Format type distribution
            const typeDistribution = {};
            typeStats.forEach(stat => {
                typeDistribution[stat.type] = {
                    count: parseInt(stat.count || 0),
                    amount: parseFloat(stat.totalAmount || 0)
                };
            });

            // Get payment method distribution
            const paymentStats = await Transaction.findAll({
                where: whereClause,
                attributes: [
                    'paymentMethod',
                    [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
                ],
                group: ['paymentMethod'],
                raw: true
            });

            // Format payment method distribution
            const paymentDistribution = {};
            paymentStats.forEach(stat => {
                paymentDistribution[stat.paymentMethod] = parseInt(stat.count || 0);
            });

            return {
                totalTransactions: parseInt(stats?.totalTransactions || 0),
                totalTopups: parseFloat(stats?.totalTopups || 0),
                totalSpent: parseFloat(stats?.totalSpent || 0),
                verificationCount: parseInt(stats?.verificationCount || 0),
                currentBalance: parseFloat(stats?.currentBalance || 0),
                statusDistribution,
                typeDistribution,
                paymentDistribution
            };
        } catch (error) {
            console.error('Error in getUserTransactionStats:', error);
            throw error;
        }
    }

    // Helper method for date range filtering
    getDateRangeFilter(dateRange, fromDate, toDate) {
        const now = new Date();
        let dateFilter = {};

        switch (dateRange) {
            case 'today':
                const todayStart = new Date(now);
                todayStart.setHours(0, 0, 0, 0);
                const todayEnd = new Date(now);
                todayEnd.setHours(23, 59, 59, 999);
                return {
                    [Op.gte]: todayStart,
                    [Op.lte]: todayEnd
                };

            case 'yesterday':
                const yesterday = new Date(now);
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStart = new Date(yesterday);
                yesterdayStart.setHours(0, 0, 0, 0);
                const yesterdayEnd = new Date(yesterday);
                yesterdayEnd.setHours(23, 59, 59, 999);
                return {
                    [Op.gte]: yesterdayStart,
                    [Op.lte]: yesterdayEnd
                };

            case 'week':
                const startOfWeek = new Date(now);
                const day = startOfWeek.getDay();
                const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
                startOfWeek.setDate(diff);
                startOfWeek.setHours(0, 0, 0, 0);
                const endOfWeek = new Date(now);
                endOfWeek.setHours(23, 59, 59, 999);
                return {
                    [Op.gte]: startOfWeek,
                    [Op.lte]: endOfWeek
                };

            case 'month':
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const endOfMonth = new Date(now);
                endOfMonth.setHours(23, 59, 59, 999);
                return {
                    [Op.gte]: startOfMonth,
                    [Op.lte]: endOfMonth
                };

            case 'quarter':
                const quarter = Math.floor((now.getMonth() + 3) / 3);
                const startOfQuarter = new Date(now.getFullYear(), (quarter - 1) * 3, 1);
                const endOfQuarter = new Date(startOfQuarter);
                endOfQuarter.setMonth(endOfQuarter.getMonth() + 3);
                endOfQuarter.setDate(0);
                endOfQuarter.setHours(23, 59, 59, 999);
                return {
                    [Op.gte]: startOfQuarter,
                    [Op.lte]: endOfQuarter
                };

            case 'year':
                const startOfYear = new Date(now.getFullYear(), 0, 1);
                const endOfYear = new Date(now);
                endOfYear.setHours(23, 59, 59, 999);
                return {
                    [Op.gte]: startOfYear,
                    [Op.lte]: endOfYear
                };

            case 'custom':
                if (fromDate && toDate) {
                    const customStart = new Date(fromDate);
                    const customEnd = new Date(toDate + 'T23:59:59.999Z');
                    return {
                        [Op.gte]: customStart,
                        [Op.lte]: customEnd
                    };
                }
                return {};

            default:
                return {};
        }
    }


    async findByType(userId, type, limit = 50) {
        return await Transaction.findAll({
            where: {
                userId,
                type
            },
            order: [['createdAt', 'DESC']],
            limit: limit || 50
        });
    }

    async findByReference(reference) {
        return await Transaction.findOne({
            where: { reference }
        });
    }

    async findByStatus(status) {
        return await Transaction.findOne({
            where: { status }
        });
    }

    async findById(id) {
        return await Transaction.findOne({
            where: { id }
        })
    }

    async updateStatus(reference, status) {
        const [affectedCount] = await Transaction.update(
            { status },
            { where: { reference } }
        );

        if (affectedCount === 0) {
            throw new Error('Transaction not found');
        }

        return await this.findByReference(reference);
    }

    async updateTransaction(id, updateData) {
        const [affectedCount] = await Transaction.update(
            updateData,
            { where: { id } }
        );

        if (affectedCount === 0) {
            throw new Error('Transaction not found');
        }

        return await Transaction.findByPk(id);
    }

    async getBalance(userId) {
        const transactions = await Transaction.findAll({
            where: {
                userId,
                status: 'completed'
            },
            attributes: ['type', 'amount']
        });

        let balance = 0;
        transactions.forEach(transaction => {
            if (transaction.type === 'topup') {
                balance += parseFloat(transaction.amount);
            } else if (transaction.type === 'verification_fee') {
                balance += parseFloat(transaction.amount);
            } else if (transaction.type === 'refund') {
                balance += parseFloat(transaction.amount);
            }
        });

        return balance;
    }

    async getRevenueStats(startDate, endDate) {
        const revenueStats = await Transaction.findOne({
            where: {
                type: 'verification_fee',
                status: 'completed',
                createdAt: {
                    [Op.between]: [startDate, endDate]
                }
            },
            attributes: [
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'totalTransactions'],
                [Sequelize.fn('SUM', Sequelize.literal('ABS(amount)')), 'totalRevenue'],
                [Sequelize.fn('AVG', Sequelize.literal('ABS(amount)')), 'averageRevenue']
            ],
            raw: true
        });

        const topupStats = await Transaction.findOne({
            where: {
                type: 'topup',
                status: 'completed',
                createdAt: {
                    [Op.between]: [startDate, endDate]
                }
            },
            attributes: [
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'totalTopups'],
                [Sequelize.fn('SUM', Sequelize.col('amount')), 'totalTopupAmount']
            ],
            raw: true
        });

        const dailyRevenue = await Transaction.findAll({
            where: {
                type: 'verification_fee',
                status: 'completed',
                createdAt: {
                    [Op.between]: [startDate, endDate]
                }
            },
            attributes: [
                [Sequelize.fn('DATE', Sequelize.col('createdAt')), 'date'],
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'transactionCount'],
                [Sequelize.fn('SUM', Sequelize.literal('ABS(amount)')), 'dailyRevenue']
            ],
            group: [Sequelize.fn('DATE', Sequelize.col('createdAt'))],
            order: [[Sequelize.fn('DATE', Sequelize.col('createdAt')), 'ASC']],
            raw: true
        });

        return {
            totalTransactions: parseInt(revenueStats?.totalTransactions || 0),
            totalRevenue: parseFloat(revenueStats?.totalRevenue || 0),
            averageRevenue: parseFloat(revenueStats?.averageRevenue || 0),
            totalTopups: parseInt(topupStats?.totalTopups || 0),
            totalTopupAmount: parseFloat(topupStats?.totalTopupAmount || 0),
            dailyRevenue: dailyRevenue.map(day => ({
                date: day.date,
                transactionCount: parseInt(day.transactionCount),
                revenue: parseFloat(day.dailyRevenue)
            }))
        };
    }

    async getTransactionReportData(userId, filters, whereClause) {

        const data = await Transaction.findAll({
            where: whereClause,
            // include: [{
            //     model: Verification,
            //     attributes: ['id', 'referenceNumber', 'firstName', 'lastName']
            // }],
            order: [['createdAt', 'DESC']]
        });

        return data;
    }


    // async getUserTransactionStats(userId, options) {
    //     const stats = await Transaction.findOne({
    //         where: {
    //             userId,
    //             status: 'completed'
    //         },
    //         attributes: [
    //             [Sequelize.fn('COUNT', Sequelize.col('id')), 'totalTransactions'],
    //             [Sequelize.literal(`SUM(CASE WHEN type = 'topup' THEN amount ELSE 0 END)`), 'totalTopups'],
    //             [Sequelize.literal(`SUM(CASE WHEN type = 'verification_fee' THEN ABS(amount) ELSE 0 END)`), 'totalSpent'],
    //             [Sequelize.literal(`COUNT(CASE WHEN type = 'verification_fee' THEN 1 END)`), 'verificationCount']
    //         ],
    //         raw: true
    //     });

    //     const stats2 = await Transaction.findOne({
    //         where: {
    //             userId,
    //         },
    //         attributes: [
    //             [Sequelize.fn('COUNT', Sequelize.col('id')), 'totalTransactions'],
    //             [Sequelize.literal(`COUNT(CASE WHEN status = 'completed' THEN 1 END)`), 'completedCount'],
    //             [Sequelize.literal(`COUNT(CASE WHEN status = 'pending' THEN 1 END)`), 'refundedCount'],
    //             [Sequelize.literal(`COUNT(CASE WHEN status = 'pending' THEN 1 END)`), 'pendingCount'],
    //             [Sequelize.literal(`COUNT(CASE WHEN status = 'failed' THEN 1 END)`), 'failedCount']
    //         ],
    //         raw: true
    //     });

    //     const recentTransactions = await this.findByUserId(userId, 10);

    //     const summary = await this.getTransactionSummary(userId);

    //     const monthlySpending = await Transaction.findAll({
    //         where: {
    //             userId,
    //             type: 'verification_fee',
    //             status: 'completed',
    //             createdAt: {
    //                 [Op.gte]: new Date(new Date().setMonth(new Date().getMonth() - 6))
    //             }
    //         },
    //         attributes: [
    //             [Sequelize.fn('date_trunc', 'month', Sequelize.col('createdAt')), 'month'],
    //             [Sequelize.fn('SUM', Sequelize.literal('ABS(amount)')), 'monthlySpent'],
    //             [Sequelize.fn('COUNT', Sequelize.col('id')), 'transactionCount']
    //         ],
    //         group: [Sequelize.fn('date_trunc', 'month', Sequelize.col('createdAt'))],
    //         order: [[Sequelize.fn('date_trunc', 'month', Sequelize.col('createdAt')), 'DESC']],
    //         raw: true // ← This prevents automatic attribute inclusion
    //     });

    //     return {
    //         ...summary,
    //         completedCount: parseInt(stats2?.completedCount || 0),
    //         refundedCount: parseInt(stats2?.refundedCount || 0),
    //         failedCount: parseInt(stats2?.failedCount || 0),
    //         pendingCount: parseInt(stats2?.pendingCount || 0),
    //         totalTransactions: parseInt(stats?.totalTransactions || 0),
    //         totalTopups: parseFloat(stats?.totalTopups || 0),
    //         totalSpent: parseFloat(stats?.totalSpent || 0),
    //         verificationCount: parseInt(stats?.verificationCount || 0),
    //         recentTransactions: recentTransactions.map(t => t.toJSON()),
    //         monthlySpending: monthlySpending.map(month => ({
    //             month: month.month,
    //             spent: parseFloat(month.monthlySpent),
    //             transactionCount: parseInt(month.transactionCount)
    //         }))
    //     };
    // }

    async getFailedTransactions(userId, days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        return await Transaction.findAll({
            where: {
                userId,
                status: 'failed',
                createdAt: {
                    [Op.gte]: startDate
                }
            },
            order: [['createdAt', 'DESC']]
        });
    }

    async getPendingTransactions(userId) {
        return await Transaction.findAll({
            where: {
                userId,
                status: 'pending'
            },
            order: [['createdAt', 'DESC']]
        });
    }

    async searchTransactions(userId, searchCriteria) {
        const { type, status, startDate, endDate, minAmount, maxAmount } = searchCriteria;

        const whereClause = { userId };

        if (type) whereClause.type = type;
        if (status) whereClause.status = status;

        if (startDate || endDate) {
            whereClause.createdAt = {};
            if (startDate) whereClause.createdAt[Op.gte] = startDate;
            if (endDate) whereClause.createdAt[Op.lte] = endDate;
        }

        if (minAmount !== undefined || maxAmount !== undefined) {
            whereClause.amount = {};
            if (minAmount !== undefined) whereClause.amount[Op.gte] = minAmount;
            if (maxAmount !== undefined) whereClause.amount[Op.lte] = maxAmount;
        }

        return await Transaction.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
            limit: 100
        });
    }

    async getTransactionSummary(userId) {
        const summary = await Transaction.findAll({
            where: {
                userId,
                status: 'completed'
            },
            attributes: [
                'type',
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
                [Sequelize.fn('SUM', Sequelize.literal('ABS(amount)')), 'totalAmount']
            ],
            group: ['type'],
            raw: true
        });

        const result = {
            topups: { count: 0, amount: 0 },
            verification_fees: { count: 0, amount: 0 },
            refunds: { count: 0, amount: 0 },
            withdrawals: { count: 0, amount: 0 }
        };

        summary.forEach(item => {
            const key = item.type === 'verification_fee' ? 'verification_fees' :
                item.type === 'topup' ? 'topups' : item.type === 'refund' ? 'refunds' : 'withdrwals';
            result[key] = {
                count: parseInt(item.count),
                amount: parseFloat(item.totalAmount || 0)
            };
        });

        result.currentBalance = await this.getBalance(userId);
        return result;
    }

    async deleteTransaction(id) {
        const affectedCount = await Transaction.destroy({
            where: { id }
        });

        if (affectedCount === 0) {
            throw new Error('Transaction not found');
        }

        return true;
    }
}

module.exports = TransactionRepository;