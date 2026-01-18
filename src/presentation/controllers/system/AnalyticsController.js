class AnalyticsController {
    constructor(
        getUserAnalyticsUseCase,
        getAdminStatsUseCase
    ) {
        this.getUserAnalytics = getUserAnalyticsUseCase;
        this.getAdminStats = getAdminStatsUseCase;
    }

    async getUserAnalytics(req, res) {
        try {
            const userId = req.user.userId;
            const { period = 'monthly' } = req.query;

            const analytics = await this.getUserAnalytics.execute(userId, period);

            res.json({
                success: true,
                data: analytics
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async getAdminStats(req, res) {
        try {
            // Check if user is admin (in production, implement proper admin check)
            const stats = await this.getAdminStats.execute();

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Render methods
    showAnalyticsDashboard(req, res) {
        res.render('dashboard/analytics', {
            title: 'Analytics - AcademicVerify',
            user: req.user
        });
    }

    showAdminDashboard(req, res) {
        res.render('admin/dashboard', {
            title: 'Admin Dashboard - AcademicVerify',
            user: req.user
        });
    }
}

module.exports = AnalyticsController;