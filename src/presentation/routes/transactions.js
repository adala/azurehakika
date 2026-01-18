const express = require('express');
const router = express.Router();
const { requireAuth, authenticateToken } = require('../middleware/auth');

module.exports = (transactionController) => {
    // Get transactions
    router.get('/recent',
        requireAuth,
        authenticateToken,
        transactionController.getRecentTransactions.bind(transactionController)
    );

    // router.get('/transactions',
    //     requireAuth,
    //     authenticateToken,
    //     transactionController.getTransactions.bind(transactionController)
    // );

    router.get('/view-all', requireAuth, authenticateToken,
        transactionController.showViewAllUserTransactionsForm.bind(transactionController)
    );

    router.get('/get-all', requireAuth, authenticateToken,
        transactionController.getAllUserTransactions.bind(transactionController)
    );

    router.get('/api/:id',
        requireAuth,
        authenticateToken,
        transactionController.getTransactionById.bind(transactionController)
    );

    // // Transaction stats and analytics
    // router.get('/transactions/stats/summary',
    //     requireAuth,
    //     authenticateToken,
    //     transactionController.getTransactionSummary.bind(transactionController)
    // );

    // router.get('/transactions/stats/overview',
    //     requireAuth,
    //     authenticateToken,
    //     transactionController.getTransactionStatistics.bind(transactionController)
    // );

    // router.get('/transactions/failed',
    //     requireAuth,
    //     authenticateToken,
    //     transactionController.getFailedTransactions.bind(transactionController)
    // );

    router.get('/refundable',
        requireAuth,
        authenticateToken,
        transactionController.getRefundableTransactions.bind(transactionController)
    );
    

    // Search transactions
    router.post('/search',
        requireAuth,
        authenticateToken,
        transactionController.searchTransactions.bind(transactionController)
    );

    // // Render pages
    // router.get('/transactions/history',
    //     requireAuth,
    //     authenticateToken,
    //     transactionController.showTransactionHistory.bind(transactionController)
    // );

    // router.get('/transactions/:id/details',
    //     requireAuth,
    //     authenticateToken,
    //     transactionController.showTransactionDetails.bind(transactionController)
    // );

    router.delete('/delete/:id',
        requireAuth,
        authenticateToken,
        transactionController.removeTransaction.bind(transactionController)
    );

    return router;
};