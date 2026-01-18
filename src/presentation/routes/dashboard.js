const express = require('express');
const router = express.Router();
const { requireAuth, authenticateToken } = require('../middleware/auth');

module.exports = (dashboardController, teamController) => {
    // Dashboard pages
    router.get('/dashboard', authenticateToken, dashboardController.showDashboard.bind(dashboardController));
    router.get('/profile', requireAuth, dashboardController.showProfile.bind(dashboardController));
    router.get('/team', authenticateToken, teamController.showTeam.bind(teamController));

    return router;
}; 