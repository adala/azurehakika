const express = require('express');
const router = express.Router();

// Middleware
const { authenticate, authorizeRole, requirePasswordChange } = require('../../middleware/system/auth');

module.exports = (systemAuthController, systemManagementController) => {
   
    // Public routes
    router.get('/login', systemAuthController.showLogin.bind(systemAuthController));
    router.post('/login', systemAuthController.login.bind(systemAuthController));
    router.get('/logout', systemAuthController.logout.bind(systemAuthController));

    // Password change (for users who must change password)
    router.get('/change-password', 
        authenticate, 
        requirePasswordChange,
        systemAuthController.showChangePassword.bind(systemAuthController));
    router.post('/change-password', 
        authenticate, 
        requirePasswordChange,
        systemAuthController.changePassword.bind(systemAuthController)); 

    // Protected routes with session authentication
    router.use(authenticate);
    router.use(requirePasswordChange);

    // Dashboard (all authenticated users)
    router.get('/dashboard/admin', systemManagementController.getAdminDashboard.bind(systemManagementController));
    router.get('/dashboard/supervisor', systemManagementController.getSupervisorDashboard.bind(systemManagementController));
    router.get('/dashboard/worker', systemManagementController.getWorkerDashboard.bind(systemManagementController));

    // Profile
    router.get('/profile', systemAuthController.getProfile.bind(systemAuthController));
    router.post('/profile/update', systemAuthController.updateProfile.bind(systemAuthController));

    // User management (admin only)
    // router.get('/users', authorizeRole(['admin']), systemManagementController.manageUsers.bind(systemManagementController));
    // router.post('/users/create', authorizeRole(['admin']), systemManagementController.createUser.bind(systemManagementController));
    // router.put('/users/:userId/status', authorizeRole(['admin']), systemManagementController.updateUserStatus.bind(systemManagementController));

    // Settings (admin only)
    router.get('/settings', authorizeRole(['admin']), systemManagementController.getSystemSettings.bind(systemManagementController));

    // Task assignment (supervisor & admin)
    // router.get('/assignments', authorizeRole(['supervisor', 'admin']), 
    //     systemManagementController.getSupervisorAssignments.bind(systemManagementController));
    router.post('/assignments/assign', authorizeRole(['supervisor', 'admin']), 
        systemManagementController.assignVerificationTask.bind(systemManagementController));

    // Worker tasks
    // router.get('/my-tasks', authorizeRole(['worker']), systemManagementController.getWorkerTasks.bind(systemManagementController));

    // Include existing assignee routes for workers
    // const assigneeRoutes = require('./assigneeRoutes')(useCases);
    // router.use('/worker', authorizeRole(['worker']), assigneeRoutes);

    return router;
};