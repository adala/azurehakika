const express = require('express');
const router = express.Router();
const DIContainer = require('../../di/container');

const container = new DIContainer();

// Import route modules
const authRoutes = require('./auth')( container.get('authController'));
const apiRoutes = require('./api')( container.get('teamController'), container.get('institutionController'));
const dashboardRoutes = require('./dashboard')( container.get('dashboardController'), container.get('teamController') );
const verificationRoutes = require('./verifications')( container.get('verificationController'), container.get('fileService') );
const transactionsRoutes = require('./transactions')( container.get('transactionController') );
const paymentsRoutes = require('./payments')( container.get('paymentController') );
const reportRoutes = require('./reports')( container.get('reportController'));

// Use routes
router.use('/auth', authRoutes);
router.use('/api', apiRoutes);
router.use('/', dashboardRoutes);
router.use('/verification', verificationRoutes);
router.use('/transactions', transactionsRoutes);
router.use('/payments', paymentsRoutes);
router.use('/reports', reportRoutes);

// Home route
router.get('/', (req, res) => {
    res.render('index', {
        title: 'Hakika - AI-Powered Certificate Verification',
        user: req.user
    });
});

router.get('/pricing', (req, res) => {
    res.render('support/pricing', {
        title: 'Pricing - Hakika',
        user: req.session.user
    });
});

router.get('/contact', (req, res) => {
    console.log(req.user);
    res.render('support/contact', {
        title: 'Contact Us - Hakika',
        user: req.session.user
    });
});

router.post('/contact', (req, res) => {
    // In a real application, you would process the contact form here
    // For now, we'll just show a success message
    res.render('support/contact-success', {
        title: 'Message Sent - Hakika',
        user: req.session.user
    });
});

router.get('/about', (req, res) => {
    res.render('support/about', {
        title: 'About Us - Hakika',
        user: req.session.user
    });
});

router.get('/terms', (req, res) => {
    res.render('support/terms', {
        title: 'Terms of Service - AcademicVerify',
        user: req.session.user
    });
});

router.get('/privacy', (req, res) => {
    res.render('support/privacy', {
        title: 'Privacy Policy - AcademicVerify',
        user: req.session.user
    });
});


module.exports = router;