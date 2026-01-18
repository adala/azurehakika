class TransactionController {
    constructor(
        getTransactionsUseCase,
        getTransactionStatsUseCase,
        deleteTransationUseCase,
        transactionRepository
    ) {
        this.getTransactionsUseCase = getTransactionsUseCase;
        this.getTransactionStats = getTransactionStatsUseCase;
        this.deleteTransaction = deleteTransationUseCase;
        this.transactionRepository = transactionRepository;
    }

    async getRecentTransactions(req, res) {
        try {

            const userId = req.user.id;
            // Parse query parameters with defaults
            const {
                page = 1,
                limit = 10,
                dateRange = 'month',
                status,
                paymentMethod,
                institution,
                fromDate,
                toDate,
                search
            } = req.query;

            // Convert page and limit to numbers
            const pageNum = parseInt(page, 10);
            const limitNum = parseInt(limit, 10);
            const offset = (pageNum - 1) * limitNum;

            // Build filter options
            const filterOptions = {
                dateRange,
                status: status === 'all' ? undefined : status,
                paymentMethod: paymentMethod === 'all' ? undefined : paymentMethod,
                institution: institution === 'all' ? undefined : institution,
                fromDate,
                toDate,
                search
            };

            // Get paginated transactions with filters
            const { transactions, total } = await this.transactionRepository.getUserTransactionsWithFilters(
                userId,
                offset,
                limitNum,
                filterOptions
            );

            // Get stats with filters
            const stats = await this.transactionRepository.getUserTransactionStats(userId, filterOptions);

            // Calculate pagination
            const totalPages = Math.ceil(total / limitNum);

            res.json({
                success: true,
                stats: stats,
                transactions: transactions.map(t => t.toJSON ? t.toJSON() : t),

                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages,
                    hasNextPage: pageNum < totalPages,
                    hasPrevPage: pageNum > 1
                }
            });

        } catch (error) {
            console.error('Error in getRecentTransactions:', error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async getTransactions(req, res) {
        try {
            const userId = req.user.id;
            const {
                limit = 10,
                type,
                status,
                startDate,
                endDate,
                page = 1
            } = req.query;

            const transactions = await this.getTransactions.execute(userId, parseInt(limit));

            res.json({
                success: true,
                data: transactions,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: transactions.length
                }
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async getAllUserTransactions(req, res) {
        try {
            const userId = req.user.id;
            const {
                limit = 50,
                type,
                status,
                startDate,
                endDate,
                page = 1
            } = req.query;

            const transactions = await this.getTransactionsUseCase.execute(userId, 10);
            const stats = await this.transactionRepository.getUserTransactionStats(userId);
            const pagination = { page: parseInt(page), limit: parseInt(limit), total: transactions.length }

            res.json({
                success: true,
                stats: stats,
                pagination: pagination
            });
        } catch (error) {
            console.log(error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async getTransactionStatistics(req, res) {
        try {
            const userId = req.user.userId;
            const stats = await this.getTransactionStatistics.execute(userId);

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async searchTransactions(req, res) {
        try {
            const userId = req.user.userId;
            const searchCriteria = req.body;

            const transactions = await this.transactionRepository.searchTransactions(userId, searchCriteria);

            res.json({
                success: true,
                data: transactions.map(t => t.toJSON())
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async getTransactionSummary(req, res) {
        try {
            const userId = req.user.id;
            const summary = await this.transactionRepository.getTransactionSummary(userId);

            res.json({
                success: true,
                data: summary
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async getFailedTransactions(req, res) {
        try {
            const userId = req.user.userId;
            const { days = 30 } = req.query;

            const transactions = await this.transactionRepository.getFailedTransactions(userId, parseInt(days));

            res.json({
                success: true,
                data: transactions.map(t => t.toJSON())
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async getTransactionById(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            let transaction = await this.transactionRepository.findById(id);

            transaction = transaction.toJSON();

            if (!transaction || transaction.userId !== userId) {
                return res.status(404).json({
                    success: false,
                    message: 'Transaction not found'
                });
            }

            res.json({
                success: true,
                data: transaction
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async getRefundableTransactions(req, res) {
        try {

            const userId = req.user.id;

            let transactions = await this.transactionRepository.findByStatus('refunded');

            if (!transactions || transactions.userId !== userId) {
                return res.status(404).json({
                    success: false,
                    message: 'Transaction not found'
                });
            }

            res.json({
                success: true,
                data: transactions
            });
        } catch (error) {
            console.log('Error in getRefundableTransactions controller: ', error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async removeTransaction(req, res) {
        try {
            try {
                const { id } = req.params;

                await this.deleteTransaction.execute(id);

                res.redirect('/transaction/view-all');
            } catch (error) {
                console.error('Delete transaction error:', error);
                res.redirect('/transaction/view-all');
            }
        } catch (error) {

        }
    }

    // Render methods
    showTransactionHistory(req, res) {
        res.render('money/transactions', {
            title: 'Transaction History - Hakika',
            user: req.user
        });
    }

    showViewAllUserTransactionsForm(req, res) {
        res.render('money/transactions-viewall', {
            title: 'Transaction History - Hakika',
            user: req.user
        });
    }

    showTransactionDetails(req, res) {
        res.render('money/transaction-details', {
            title: 'Transaction Details - Hakika',
            user: req.user,
            transactionId: req.params.id
        });
    }
}

module.exports = TransactionController;