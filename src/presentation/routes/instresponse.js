const express = require('express');
const router = express.Router();
const { requireAuth, authenticateToken } = require('../middleware/auth');

module.exports = (instResponseController, fileService) => {

    // Internal staff routes (API processing)
    router.get('/pending', 
        authenticateToken, 
        instResponseController.listPendingRequests.bind(instResponseController));
    router.post('/:verificationId/process-api', 
        authenticateToken,
        instResponseController.processApiResponse.bind(controller));

   // University staff routes (manual entry)
    router.post('/:verificationId/manual-entry', authenticateToken, 
        instResponseController.submitManualEntry.bind(instResponseController));
    
    // Common routes
    router.get('/:verificationId', authenticateToken, 
        instResponseController.getResponseDetails.bind(instResponseController));


    return router;
};