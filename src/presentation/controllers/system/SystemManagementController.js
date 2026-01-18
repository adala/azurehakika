class SystemManagementController {
    constructor(useCases) {
        this.useCases = useCases;
    }

    // Dashboard Methods
    async getAdminDashboard(req, res) {
        try {
            const userId = req.session.user.id;

            const userRole = req.session.user.role;
            
            const dashboardData = await this.useCases.dashboardStats.execute(userId, 'admin');
            console.log(dashboardData);
            res.render('system/dashboard', {
                title: `${userRole.charAt(0).toUpperCase() + userRole.slice(1)} Dashboard`,
                user: req.session.user,
                layout: 'system',
                currentDate: new Date(),
                ...dashboardData
            });
        } catch (error) {
            console.log(error);
            res.status(500).render('errors/500', {
                layout: 'system',
                message: 'Failed to load admin dashboard',
                error: error.message
            });
        }
    }

    async getSupervisorDashboard(req, res) {
        try {
            const userId = req.session.user.id;

            const userRole = req.session.user.role;
            
           // const dashboardData = await this.useCases.dashboardStats.execute(userId, 'supervisor');
            
            res.render('system/dashboard', {
                title: `${userRole.charAt(0).toUpperCase() + userRole.slice(1)} Dashboard`,
                user: req.session.user,
                layout: 'system',
              //  ...dashboardData
            });
        } catch (error) {
            res.status(500).render('error', {
                message: 'Failed to load supervisor dashboard',
                error: error.message
            });
        }
    }

    async getWorkerDashboard(req, res) {
        try {
            const userId = req.session.user.id;
            
            const dashboardData = await this.useCases.dashboardStats.execute(userId, 'worker');
            
            res.render('system/dashboard', {
                title: 'Worker Dashboard',
                user: req.session.user,
                layout: 'management',
                ...dashboardData
            });
        } catch (error) {
            res.status(500).render('error', {
                message: 'Failed to load worker dashboard',
                error: error.message
            });
        }
    }

    // User Management (Admin only)
    async listUsers(req, res) {
        try {
            const { role, status } = req.query;
            const filters = {};
            
            if (role) filters.role = role;
            if (status) filters.status = status;
            
            const users = await this.useCases.userManagement.listUsers(filters);
            
            res.render('management/admin/users/list', {
                title: 'Manage System Users',
                user: req.session.user,
                layout: 'management',
                users,
                filters
            });
        } catch (error) {
            res.status(500).render('error', {
                message: 'Failed to load users',
                error: error.message
            });
        }
    }

    async createUserForm(req, res) {
        try {
            res.render('management/admin/users/create', {
                title: 'Create New User',
                user: req.session.user,
                layout: 'management'
            });
        } catch (error) {
            res.status(500).render('error', {
                message: 'Failed to load form',
                error: error.message
            });
        }
    }

    async createUser(req, res) {
        try {
            const { username, email, firstName, lastName, role, department } = req.body;
            const createdBy = req.session.user.id;
            
            const result = await this.useCases.userManagement.createUser({
                username,
                email,
                firstName,
                lastName,
                role,
                department,
                createdBy
            });
            
            res.json({
                success: true,
                data: {
                    user: result.user,
                    tempPassword: result.tempPassword
                },
                message: 'User created successfully'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async updateUserForm(req, res) {
        try {
            const { userId } = req.params;
            
            const user = await this.useCases.userManagement.getUserById(userId);
            
            res.render('management/admin/users/edit', {
                title: 'Edit User',
                user: req.session.user,
                layout: 'management',
                editUser: user
            });
        } catch (error) {
            res.status(500).render('error', {
                message: 'Failed to load edit form',
                error: error.message
            });
        }
    }

    async updateUser(req, res) {
        try {
            const { userId } = req.params;
            const updates = req.body;
            
            const user = await this.useCases.userManagement.updateUser(userId, updates);
            
            res.json({
                success: true,
                data: user,
                message: 'User updated successfully'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async toggleUserStatus(req, res) {
        try {
            const { userId } = req.params;
            const { isActive } = req.body;
            
            await this.useCases.userManagement.toggleUserStatus(userId, isActive);
            
            res.json({
                success: true,
                message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async resetUserPassword(req, res) {
        try {
            const { userId } = req.params;
            
            const result = await this.useCases.userManagement.resetPassword(userId);
            
            res.json({
                success: true,
                data: {
                    tempPassword: result.tempPassword
                },
                message: 'Password reset successfully'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    // Task Assignment (Supervisor)
    async listPendingAssignments(req, res) {
        try {
            const supervisorId = req.session.user.id;
            
            const assignments = await this.useCases.taskAssignment.listPendingAssignments(supervisorId);
            const workers = await this.useCases.userManagement.listUsers({ role: 'worker', status: 'active' });
            
            res.render('management/supervisor/assignments/list', {
                title: 'Pending Assignments',
                user: req.session.user,
                layout: 'management',
                assignments,
                workers
            });
        } catch (error) {
            res.status(500).render('error', {
                message: 'Failed to load assignments',
                error: error.message
            });
        }
    }

    async assignVerificationTask(req, res) {
        try {
            const { verificationId, assigneeId, priority, dueDate, notes } = req.body;
            const assignedBy = req.session.user.id;
            
            const assignment = await this.useCases.taskAssignment.assignTask({
                verificationId,
                assigneeId,
                assignedBy,
                priority,
                dueDate,
                notes
            });
            
            res.json({
                success: true,
                data: assignment,
                message: 'Task assigned successfully'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async reassignTask(req, res) {
        try {
            const { assignmentId } = req.params;
            const { newAssigneeId } = req.body;
            
            const assignment = await this.useCases.taskAssignment.reassignTask(assignmentId, newAssigneeId);
            
            res.json({
                success: true,
                data: assignment,
                message: 'Task reassigned successfully'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    // Worker Tasks
    async listWorkerTasks(req, res) {
        try {
            const workerId = req.session.user.id;
            
            const tasks = await this.useCases.taskAssignment.getWorkerTasks(workerId);
            
            res.render('management/worker/tasks/list', {
                title: 'My Tasks',
                user: req.session.user,
                layout: 'management',
                tasks
            });
        } catch (error) {
            res.status(500).render('error', {
                message: 'Failed to load tasks',
                error: error.message
            });
        }
    }

    async getTaskDetails(req, res) {
        try {
            const { taskId } = req.params;
            const workerId = req.session.user.id;
            
            const task = await this.useCases.taskAssignment.getTaskDetails(taskId, workerId);
            
            res.render('management/worker/tasks/detail', {
                title: 'Task Details',
                user: req.session.user,
                layout: 'management',
                task
            });
        } catch (error) {
            res.status(500).render('error', {
                message: 'Failed to load task details',
                error: error.message
            });
        }
    }

    // Activity Monitoring
    async getUserActivity(req, res) {
        try {
            const { userId } = req.params;
            
            const activity = await this.useCases.activityMonitoring.getUserActivity(userId);
            
            res.json({
                success: true,
                data: activity
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async getSystemActivity(req, res) {
        try {
            const { startDate, endDate, eventType } = req.query;
            
            const activity = await this.useCases.activityMonitoring.getSystemActivity({
                startDate,
                endDate,
                eventType
            });
            
            res.render('management/admin/activity/system', {
                title: 'System Activity Log',
                user: req.session.user,
                layout: 'management',
                activity,
                filters: { startDate, endDate, eventType }
            });
        } catch (error) {
            res.status(500).render('error', {
                message: 'Failed to load system activity',
                error: error.message
            });
        }
    }

    async getUserActivityReport(req, res) {
        try {
            const { userId } = req.params;
            const { startDate, endDate } = req.query;
            
            const report = await this.useCases.activityMonitoring.getUserActivityReport(userId, {
                startDate,
                endDate
            });
            
            res.json({
                success: true,
                data: report
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    // Settings Management (Admin)
    async getSystemSettings(req, res) {
        try {
            const settings = await this.useCases.systemSettings.getSettings();
            
            res.render('management/admin/settings/list', {
                title: 'System Settings',
                user: req.session.user,
                layout: 'management',
                settings
            });
        } catch (error) {
            res.status(500).render('error', {
                message: 'Failed to load settings',
                error: error.message
            });
        }
    }

    async updateSystemSettings(req, res) {
        try {
            const { settings } = req.body;
            
            await this.useCases.systemSettings.updateSettings(settings);
            
            res.json({
                success: true,
                message: 'Settings updated successfully'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async getRolePermissions(req, res) {
        try {
            const permissions = await this.useCases.systemSettings.getRolePermissions();
            
            res.json({
                success: true,
                data: permissions
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async updateRolePermissions(req, res) {
        try {
            const { role, permissions } = req.body;
            
            await this.useCases.systemSettings.updateRolePermissions(role, permissions);
            
            res.json({
                success: true,
                message: 'Role permissions updated successfully'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    // Reports (Admin & Supervisor)
    async getVerificationReport(req, res) {
        try {
            const { startDate, endDate, institutionId, status } = req.query;
            
            const report = await this.useCases.reports.getVerificationReport({
                startDate,
                endDate,
                institutionId,
                status
            });
            
            res.render('management/reports/verifications', {
                title: 'Verification Report',
                user: req.session.user,
                layout: 'management',
                report,
                filters: { startDate, endDate, institutionId, status }
            });
        } catch (error) {
            res.status(500).render('error', {
                message: 'Failed to generate report',
                error: error.message
            });
        }
    }

    async getUserPerformanceReport(req, res) {
        try {
            const { startDate, endDate, userId } = req.query;
            
            const report = await this.useCases.reports.getUserPerformanceReport({
                startDate,
                endDate,
                userId
            });
            
            res.render('management/reports/performance', {
                title: 'User Performance Report',
                user: req.session.user,
                layout: 'management',
                report,
                filters: { startDate, endDate, userId }
            });
        } catch (error) {
            res.status(500).render('error', {
                message: 'Failed to generate performance report',
                error: error.message
            });
        }
    }

    async exportReport(req, res) {
        try {
            const { reportType, format, ...filters } = req.query;
            
            const report = await this.useCases.reports.exportReport(reportType, format, filters);
            
            if (format === 'csv') {
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename=${reportType}-${Date.now()}.csv`);
                return res.send(report.data);
            } else if (format === 'pdf') {
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename=${reportType}-${Date.now()}.pdf`);
                return res.send(report.data);
            } else {
                return res.json({
                    success: true,
                    data: report
                });
            }
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    // Profile Management
    async getProfile(req, res) {
        try {
            const userId = req.session.user.id;
            
            const profile = await this.useCases.userManagement.getUserById(userId);
            const activity = await this.useCases.activityMonitoring.getUserActivity(userId, 10);
            
            res.render('management/profile/view', {
                title: 'My Profile',
                user: req.session.user,
                layout: 'management',
                profile,
                recentActivity: activity
            });
        } catch (error) {
            res.status(500).render('error', {
                message: 'Failed to load profile',
                error: error.message
            });
        }
    }

    async updateProfile(req, res) {
        try {
            const userId = req.session.user.id;
            const { firstName, lastName, email, department } = req.body;
            
            const user = await this.useCases.userManagement.updateUser(userId, {
                firstName,
                lastName,
                email,
                department
            });
            
            // Update session
            req.session.user.firstName = firstName;
            req.session.user.lastName = lastName;
            req.session.user.email = email;
            req.session.user.department = department;
            
            res.json({
                success: true,
                data: user,
                message: 'Profile updated successfully'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async changePassword(req, res) {
        try {
            const userId = req.session.user.id;
            const { currentPassword, newPassword, confirmPassword } = req.body;
            
            await this.useCases.userManagement.changePassword(
                userId,
                currentPassword,
                newPassword,
                confirmPassword
            );
            
            res.json({
                success: true,
                message: 'Password changed successfully'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    // Audit Trail
    async getAuditTrail(req, res) {
        try {
            const { entityType, entityId, action, startDate, endDate } = req.query;
            
            const auditTrail = await this.useCases.activityMonitoring.getAuditTrail({
                entityType,
                entityId,
                action,
                startDate,
                endDate
            });
            
            res.render('management/admin/audit/trail', {
                title: 'Audit Trail',
                user: req.session.user,
                layout: 'management',
                auditTrail,
                filters: { entityType, entityId, action, startDate, endDate }
            });
        } catch (error) {
            res.status(500).render('error', {
                message: 'Failed to load audit trail',
                error: error.message
            });
        }
    }

    async exportAuditTrail(req, res) {
        try {
            const { format, ...filters } = req.query;
            
            const report = await this.useCases.activityMonitoring.exportAuditTrail(format, filters);
            
            if (format === 'csv') {
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename=audit-trail-${Date.now()}.csv`);
                return res.send(report.data);
            } else {
                return res.json({
                    success: true,
                    data: report
                });
            }
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    // Error handling middleware
    handleError(error, req, res, next) {
        console.error('[ManagementController] Error:', error);
        
        if (req.xhr || req.headers.accept.includes('json')) {
            return res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error.message
            });
        }
        
        res.status(500).render('error', {
            message: 'An unexpected error occurred',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later'
        });
    }
}

module.exports = SystemManagementController;