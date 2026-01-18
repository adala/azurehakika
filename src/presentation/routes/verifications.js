const express = require('express');
const router = express.Router();
const { requireAuth, authenticateToken } = require('../middleware/auth');

module.exports = (verificationController, fileService) => {

    // IMPORTANT: Multer must run BEFORE authenticateToken to process the form data
    router.post('/start',
        fileService.getMulterMiddleware(), // Process files and form data first
        authenticateToken, // Then check authentication
        verificationController.startVerification.bind(verificationController)
    );

    router.get('/start', requireAuth, 
        verificationController.showVerificationForm.bind(verificationController)
    );

    router.get('/view-details/:id', requireAuth,
        verificationController.showVerificationDetails.bind(verificationController)
    );

    router.get('/view-all', requireAuth,
        verificationController.showViewAllUserVerificationsForm.bind(verificationController)
    );

    router.post('/view-all', requireAuth, 
        verificationController.getAllUserVerifications.bind(verificationController)
    );
      
    return router;
};