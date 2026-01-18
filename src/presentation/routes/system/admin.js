const express = require('express');
const router = express.Router();
const { authenticateToken, requireAuth } = require('../../middleware/auth');
const { requireAdmin } = require('../../middleware/admin');

module.exports = (adminController) => {

    // Public endpoints (for registration forms)
    router.post('/forgot-password', adminController.forgotPassword.bind(adminController));
    router.get('/reset-password', adminController.showResetPassword.bind(adminController));
    router.post('/reset-password', adminController.resetPassword.bind(adminController));

    // Admin routes
    router.post('/assign', authenticateToken, adminController.assignForProcessing.bind(adminController));

    router.get('/countries', requireAdmin,
        adminController.getCountries.bind(adminController)
    );

    router.get('/company-types', requireAdmin,
        adminController.getCompanyTypes.bind(adminController)
    );

    router.get('/institutions', requireAdmin,
        adminController.getInstitutions.bind(adminController)
    );

    // Admin endpoints
    router.put('/countries',
        requireAdmin,
        adminController.updateCountries.bind(adminController)
    );

    router.put('/company-types',
        requireAdmin,
        adminController.updateCompanyTypes.bind(adminController)
    );

    router.get('/config/:key',
        requireAdmin,
        adminController.getConfiguration.bind(adminController)
    );

    router.post('/config',
        authenticateToken,
        requireAdmin,
        adminController.setConfiguration.bind(adminController)
    );

    router.get('/config',
        authenticateToken,
        requireAdmin,
        adminController.getAllConfigurations.bind(adminController)
    );

    // Admin views
    router.get('/',
        adminController.showAdminLogin.bind(adminController)
    );

    router.post('/login',
        adminController.login.bind(adminController)
    );

    router.get('/dashboard',
        adminController.showDashboard.bind(adminController)
    );

    router.get('/institution',
        requireAdmin,
        adminController.showInstitutionManagement.bind(adminController)
    );
    router.get('/configuration',
        requireAdmin,
        adminController.showConfigurationManagement.bind(adminController)
    );

    router.get('/country',
        requireAdmin,
        adminController.showCountriesManagement.bind(adminController)
    );

    router.get('/company-type',
        requireAdmin,
        adminController.showCompanyTypesManagement.bind(adminController)
    );

    router.get('/logout', (req, res) => {
        // Set logout success message
        res.locals.flash.set('You have been logged out successfully.', 'info');
        // Clear session
        req.session.destroy((err) => {
            if (err) {
                return res.redirect('/admin/dashboard');
            }
            res.clearCookie('connect.sid');
            res.redirect('/admin');
        });
    }
    )

    return router;
};