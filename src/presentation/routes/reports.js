const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

module.exports = (reportController) => {
    // Verification reports
    router.get('/verifications/:id/pdf',
        authenticateToken,
        reportController.downloadVerificationReport.bind(reportController)
    );

    // Bulk verification reports
    router.get('/bulk-verifications/:id',
        authenticateToken,
        reportController.downloadBulkVerificationReport.bind(reportController)
    );

    // Transaction receipts
    router.get('/transactions/:id/receipt',
        authenticateToken,
        reportController.downloadTransactionReceipt.bind(reportController)
    );

    router.get('/transactions/pdf',
        authenticateToken,
        reportController.downloadTransactionReportPDF.bind(reportController)
    );

    // Analytics reports
    router.get('/analytics/report',
        authenticateToken,
        reportController.downloadAnalyticsReport.bind(reportController)
    );

    // Custom reports
    router.post('/reports/custom',
        authenticateToken,
        reportController.generateCustomReport.bind(reportController)
    );

    return router;
};