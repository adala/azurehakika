const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');

module.exports = (AssigneeController) => {
  
    // Dashboard
    router.get('/dashboard', authenticateToken, AssigneeController.getDashboard.bind(AssigneeController));
    
    // Manual entry
    router.get('/assignments/:assignmentId/manual-entry', authenticateToken, 
        AssigneeController.showManualEntryForm.bind(AssigneeController));
    router.post('/assignments/:assignmentId/manual-entry', authenticateToken,
        AssigneeController.processManualEntry.bind(AssigneeController));
    
    // API processing
    router.post('/assignments/:assignmentId/process-api', authenticateToken, 
        AssigneeController.processApiVerification.bind(AssigneeController));
    router.get('/assignments/:assignmentId/status', authenticateToken, 
        AssigneeController.getProcessingStatus.bind(AssigneeController));

    return router;
};