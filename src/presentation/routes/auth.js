const express = require('express');
const router = express.Router();

const { authenticateToken, requireAuth } = require('../middleware/auth');

module.exports = (authController) => {
    // Render forms
    router.get('/register', authController.showRegisterForm.bind(authController));
    router.get('/welcome', authController.showWelcomePage.bind(authController));
    router.get('/login', authController.showLoginForm.bind(authController));
    router.get('/otp', authController.showOTPForm.bind(authController));
    router.get('/logout', authController.logout.bind(authController));

    // API endpoints
    router.post('/register', authController.register.bind(authController));
    router.post('/login', authController.login.bind(authController));
    router.post('/verify-otp', authController.verifyOTP.bind(authController));
    router.get('/verify-email/:userId', authController.verifyEmail.bind(authController));
    router.get('/resend/:id', authController.resendVerification.bind(authController));

    router.post('/update-email', requireAuth, authenticateToken,  authController.updateEmail.bind(authController));
    router.post('/update-password', requireAuth, authenticateToken, authController.updatePassword.bind(authController));
    
    return router;
};