const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { requireAuth, authenticateToken } = require('../middleware/auth');

module.exports = (paymentController) => {
    // Add funds page
    router.get('/add-funds', requireAuth, paymentController.showAddFunds.bind(paymentController));
    
    // Wallet page
    router.get('/wallet', requireAuth, paymentController.showWallet.bind(paymentController));
    
    // Get balance (API)
    router.get('/balance', requireAuth, paymentController.getBalance.bind(paymentController));
    
    // Initialize payment
    router.post('/initialize', 
        requireAuth,
        [
            body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least 1'),
            body('paymentMethod').isIn(['card', 'mobile_money', 'momo']).withMessage('Invalid payment method'),
            body('currency').optional().isLength({ min: 3, max: 3 }),
            body('provider').optional().isString(),
            body('phoneNumber').optional().isMobilePhone(),
            body('card').optional().isObject()
        ],
        paymentController.initializePayment.bind(paymentController)
    );
    
    // Verify payment callback (Paystack redirect)
    router.get('/verify', 
        requireAuth,
        [
            query('reference').isString().notEmpty()
        ],
        paymentController.verifyPayment.bind(paymentController)
    );
    
    // Submit PIN (for card payments)
    router.post('/submit-pin',
        requireAuth,
        [
            body('reference').isString().notEmpty(),
            body('pin').isString().isLength({ min: 4, max: 4 })
        ],
        paymentController.submitPin.bind(paymentController)
    );
    
    // Submit OTP (for card payments)
    router.post('/submit-otp',
        requireAuth,
        [
            body('reference').isString().notEmpty(),
            body('otp').isString().isLength({ min: 6, max: 6 })
        ],
        paymentController.submitOTP.bind(paymentController)
    );
    
    // Payment webhook (no auth required)
    router.post('/webhook/paystack',
        express.raw({ type: 'application/json' }),
        paymentController.handleWebhook.bind(paymentController)
    );
    
    // Get payment status
    router.get('/status/:reference',
        requireAuth,
        [
            param('reference').isString().notEmpty()
        ],
        paymentController.getPaymentStatus.bind(paymentController)
    );
    
    // Get banks list (for transfers)
    router.get('/banks',
        requireAuth,
        [
            query('country').optional().isString()
        ],
        paymentController.getBanks.bind(paymentController)
    );
    
    // Payment processing page
    router.get('/processing',
        requireAuth,
        [
            query('reference').isString().notEmpty(),
            query('method').optional().isString()
        ],
        paymentController.showPaymentProcessing.bind(paymentController)
    );

    return router;
};