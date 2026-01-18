const express = require('express');
const router = express.Router();
const { authenticateToken, requireAuth } = require('../middleware/auth');

module.exports = (teamController, institutionController) => {
    
    router.get('/team/members', requireAuth, authenticateToken, teamController.getMembers.bind(teamController));
    router.post('/team/invite', requireAuth, authenticateToken, teamController.inviteMember.bind(teamController));
    router.get('/team/activate/:id', teamController.activateMember.bind(teamController));
    router.delete('/team/remove/:id', requireAuth, authenticateToken, teamController.removeMember.bind(teamController));
    router.post('/team/resend-invitation/:email', requireAuth, authenticateToken, teamController.resendInvitation.bind(teamController));
    
    router.get('/institutions', requireAuth, institutionController.getInstitutionsData.bind(institutionController));
    router.get('/institutions-page', requireAuth, institutionController.showInstitutionsPage.bind(institutionController));
    router.get('/institutions/popular', requireAuth, institutionController.getPopularInstitutions.bind(institutionController));
    return router;
}; 