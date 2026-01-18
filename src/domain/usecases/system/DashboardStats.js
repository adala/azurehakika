const BaseUseCase = require('../BaseUseCase');

class DashboardStats extends BaseUseCase {
    async execute(userId, role) {
        // Get user details
        const user = await this.repositories.user.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Role-specific dashboard data
        const roleData = await this.getRoleSpecificData(userId, role);

        // Common dashboard data
        const commonData = await this.getCommonDashboardData();

        // Recent activity
        const recentActivity = await this.getRecentActivity(userId, role);

        // Notifications
        const notifications = await this.getUserNotifications(userId);

        return {
            user,
            counts: roleData.counts,
            charts: roleData.charts,
            recentActivity,
            notifications,
            quickStats: roleData.quickStats,
            overview: commonData
        };
    }

    async getRoleSpecificData(userId, role) {
        switch (role) {
            case 'admin':
                return await this.getAdminDashboardData();
            case 'supervisor':
                return await this.getSupervisorDashboardData(userId);
            case 'worker':
                return await this.getWorkerDashboardData(userId);
            default:
                throw new Error('Invalid role');
        }
    }

    async getAdminDashboardData() {
        const [
            totalUsers,
            activeUsers,
            totalInstitutions,
            pendingVerifications,
            pendingAssignments,
            completedVerifications,
            apiVerifications,
            manualVerifications
        ] = await Promise.all([
            this.repositories.user.count(),
            this.repositories.user.countActive(),
            this.repositories.institution.count(),
            this.repositories.verification.countByStatus('pending'),
            this.repositories.assignment.countByStatus('pending'),
            this.repositories.verification.countByStatus('completed'),
            this.repositories.verification.countByProcess('auto'),
            this.repositories.verification.countByProcess('manual')
        ]);

        // User role distribution
        const userRoles = await this.repositories.user.countByRole();

        // Verification status distribution
        const verificationStatus = await this.repositories.verification.getStatusDistribution();

        // Monthly verification trend
        const monthlyTrend = await this.repositories.verification.getMonthlyTrend(6);

        return {
            counts: {
                totalUsers,
                activeUsers,
                totalInstitutions,
                pendingVerifications,
                pendingAssignments,
                completedVerifications,
                apiVerifications,
                manualVerifications
            },
            charts: {
                userRoles: Object.entries(userRoles).map(([role, count]) => ({
                    role: this.formatRoleName(role),
                    count
                })),
                verificationStatus: Object.entries(verificationStatus).map(([status, count]) => ({
                    status: this.formatStatus(status),
                    count
                })),
                monthlyTrend: monthlyTrend.map(month => ({
                    month: month.month,
                    count: month.count
                }))
            },
            quickStats: [
                {
                    title: 'User Growth',
                    value: '12.5%',
                    change: 'positive',
                    icon: 'fas fa-user-friends',
                    color: 'primary'
                },
                {
                    title: 'API Success Rate',
                    value: '94.2%',
                    change: 'positive',
                    icon: 'fas fa-plug',
                    color: 'success'
                },
                {
                    title: 'Avg Response Time',
                    value: '2.4s',
                    change: 'negative',
                    icon: 'fas fa-clock',
                    color: 'warning'
                }
            ]
        };
    }

    async getSupervisorDashboardData(supervisorId) {
        const [
            assignedWorkers,
            pendingAssignments,
            completedAssignments,
            inProgressTasks,
            overdueTasks,
            teamProductivity
        ] = await Promise.all([
            this.repositories.user.countByRoleAndSupervisor('worker', supervisorId),
            this.repositories.assignment.countBySupervisorAndStatus(supervisorId, 'pending'),
            this.repositories.assignment.countBySupervisorAndStatus(supervisorId, 'completed'),
            this.repositories.assignment.countBySupervisorAndStatus(supervisorId, 'processing'),
            this.repositories.assignment.countOverdueBySupervisor(supervisorId),
            this.repositories.assignment.getTeamProductivity(supervisorId)
        ]);

        // Worker performance
        const workerPerformance = await this.repositories.assignment.getWorkerPerformance(supervisorId);

        // Task priority distribution
        const priorityDistribution = await this.repositories.assignment.getPriorityDistribution(supervisorId);

        // Weekly completion rate
        const weeklyCompletion = await this.repositories.assignment.getWeeklyCompletionRate(supervisorId, 4);

        return {
            counts: {
                assignedWorkers,
                pendingAssignments,
                completedAssignments,
                inProgressTasks,
                overdueTasks,
                teamProductivity: Math.round(teamProductivity)
            },
            charts: {
                workerPerformance: workerPerformance.map(worker => ({
                    name: worker.name,
                    completed: worker.completed,
                    pending: worker.pending,
                    accuracy: worker.accuracy
                })),
                priorityDistribution: Object.entries(priorityDistribution).map(([priority, count]) => ({
                    priority: this.formatPriority(priority),
                    count
                })),
                weeklyCompletion: weeklyCompletion.map(week => ({
                    week: week.week,
                    rate: week.rate
                }))
            },
            quickStats: [
                {
                    title: 'Team Productivity',
                    value: `${teamProductivity}%`,
                    change: teamProductivity > 80 ? 'positive' : 'negative',
                    icon: 'fas fa-chart-line',
                    color: 'primary'
                },
                {
                    title: 'On-time Completion',
                    value: '88.7%',
                    change: 'positive',
                    icon: 'fas fa-check-circle',
                    color: 'success'
                },
                {
                    title: 'Avg Task Duration',
                    value: '3.2h',
                    change: 'negative',
                    icon: 'fas fa-hourglass-half',
                    color: 'warning'
                }
            ]
        };
    }

    async getWorkerDashboardData(workerId) {
        const [
            pendingTasks,
            completedTasks,
            inProgressTasks,
            overdueTasks,
            accuracyRate,
            avgCompletionTime
        ] = await Promise.all([
            this.repositories.assignment.countByAssigneeAndStatus(workerId, 'pending'),
            this.repositories.assignment.countByAssigneeAndStatus(workerId, 'completed'),
            this.repositories.assignment.countByAssigneeAndStatus(workerId, 'processing'),
            this.repositories.assignment.countOverdueByAssignee(workerId),
            this.repositories.assignment.getWorkerAccuracy(workerId),
            this.repositories.assignment.getAverageCompletionTime(workerId)
        ]);

        // Daily task completion
        const dailyCompletion = await this.repositories.assignment.getDailyCompletion(workerId, 7);

        // Task type distribution
        const taskTypeDistribution = await this.repositories.assignment.getTaskTypeDistribution(workerId);

        // Performance trend
        const performanceTrend = await this.repositories.assignment.getPerformanceTrend(workerId, 30);

        return {
            counts: {
                pendingTasks,
                completedTasks,
                inProgressTasks,
                overdueTasks,
                accuracyRate: Math.round(accuracyRate),
                avgCompletionTime: Math.round(avgCompletionTime / 60) // Convert to minutes
            },
            charts: {
                dailyCompletion: dailyCompletion.map(day => ({
                    day: this.formatDay(day.day),
                    count: day.count
                })),
                taskTypeDistribution: Object.entries(taskTypeDistribution).map(([type, count]) => ({
                    type: this.formatTaskType(type),
                    count
                })),
                performanceTrend: performanceTrend.map(point => ({
                    date: point.date,
                    score: point.score
                }))
            },
            quickStats: [
                {
                    title: 'Accuracy Rate',
                    value: `${Math.round(accuracyRate)}%`,
                    change: accuracyRate > 90 ? 'positive' : 'negative',
                    icon: 'fas fa-bullseye',
                    color: 'primary'
                },
                {
                    title: 'Avg Task Time',
                    value: `${Math.round(avgCompletionTime / 60)}m`,
                    change: 'positive',
                    icon: 'fas fa-clock',
                    color: 'success'
                },
                {
                    title: 'Productivity Score',
                    value: '78/100',
                    change: 'positive',
                    icon: 'fas fa-chart-bar',
                    color: 'warning'
                }
            ]
        };
    }

    async getCommonDashboardData() {
        const [
            totalVerifications,
            successfulVerifications,
            failedVerifications,
            systemUptime
        ] = await Promise.all([
            this.repositories.verification.count(),
            this.repositories.verification.countSuccessful(),
            this.repositories.verification.countFailed(),
            // this.repositories.system.getUptime()
        ]);

        return {
            totalVerifications,
            successfulVerifications,
            failedVerifications,
            // systemUptime,
            successRate: totalVerifications > 0
                ? Math.round((successfulVerifications / totalVerifications) * 100)
                : 0
        };
    }

    async getRecentActivity(userId, role) {
        const limit = 10;

        switch (role) {
            case 'admin':
                return await this.repositories.activity.getRecentSystemActivity(limit);
            case 'supervisor':
                return await this.repositories.activity.getRecentTeamActivity(userId, limit);
            case 'worker':
                return await this.repositories.activity.getRecentUserActivity(userId, limit);
            default:
                return [];
        }
    }

    async getUserNotifications(userId) {
        const notifications = await this.repositories.notification.getUnreadByUser(userId, 5);

        return notifications.map(notification => ({
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            timestamp: notification.createdAt,
            isRead: notification.isRead,
            priority: notification.priority
        }));
    }

    // Helper methods
    formatRoleName(role) {
        const roleNames = {
            'admin': 'Administrator',
            'supervisor': 'Supervisor',
            'worker': 'Worker'
        };
        return roleNames[role] || role;
    }

    formatStatus(status) {
        const statusNames = {
            'pending': 'Pending',
            'processing': 'Processing',
            'completed': 'Completed',
            'failed': 'Failed'
        };
        return statusNames[status] || status;
    }

    formatPriority(priority) {
        const priorityNames = {
            'low': 'Low',
            'medium': 'Medium',
            'high': 'High',
            'urgent': 'Urgent'
        };
        return priorityNames[priority] || priority;
    }

    formatTaskType(type) {
        const typeNames = {
            'api': 'API Verification',
            'manual': 'Manual Entry',
            'review': 'Review Required'
        };
        return typeNames[type] || type;
    }

    formatDay(day) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days[new Date(day).getDay()] || day;
    }
}

module.exports = DashboardStats;