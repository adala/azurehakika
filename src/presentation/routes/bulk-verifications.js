const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

module.exports = (bulkVerificationController, fileService) => {
    // Process bulk verification
    router.post('/bulk-verifications',
        authenticateToken,
        fileService.getBulkUploadMiddleware(),
        bulkVerificationController.processBulk.bind(bulkVerificationController)
    );

    // Get bulk verifications
    router.get('/bulk-verifications',
        authenticateToken,
        bulkVerificationController.getBulkVerifications.bind(bulkVerificationController)
    );

    router.get('/bulk-verifications/:id',
        authenticateToken,
        bulkVerificationController.getBulkVerificationById.bind(bulkVerificationController)
    );

    // Bulk verification stats and analytics
    router.get('/bulk-verifications/stats/overview',
        authenticateToken,
        bulkVerificationController.getBulkStats.bind(bulkVerificationController)
    );

    router.get('/bulk-verifications/stats/summary',
        authenticateToken,
        bulkVerificationController.getBulkSummary.bind(bulkVerificationController)
    );

    // Search bulk verifications
    router.post('/bulk-verifications/search',
        authenticateToken,
        bulkVerificationController.searchBulkVerifications.bind(bulkVerificationController)
    );

    // Manage bulk verifications
    router.post('/bulk-verifications/:id/cancel',
        authenticateToken,
        bulkVerificationController.cancelBulkVerification.bind(bulkVerificationController)
    );

    router.delete('/bulk-verifications/:id',
        authenticateToken,
        bulkVerificationController.deleteBulkVerification.bind(bulkVerificationController)
    );

    // Render pages
    router.get('/bulk-verifications/upload',
        authenticateToken,
        bulkVerificationController.showBulkUpload.bind(bulkVerificationController)
    );

    router.get('/bulk-verifications/history',
        authenticateToken,
        bulkVerificationController.showBulkHistory.bind(bulkVerificationController)
    );

    router.get('/bulk-verifications/:id/details',
        authenticateToken,
        bulkVerificationController.showBulkDetails.bind(bulkVerificationController)
    );

    router.get('/bulk-verifications/results',
        authenticateToken,
        bulkVerificationController.showBulkResults.bind(bulkVerificationController)
    );

    return router;
};