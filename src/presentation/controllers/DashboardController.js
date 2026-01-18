const DashboardUtility = require('../../domain/utils/DashboardUtility');
class DashboardController {
    constructor(dashboardUseCase) {
        this.dashboardUseCase = dashboardUseCase;
        this.dashboardUtility = new DashboardUtility();
    }

    async showDashboard(req, res) {
        let user;
        try {
            
            user = req.user; 
            
            const data = await this.dashboardUtility.getDashboardData(user.id, this.dashboardUseCase);
            
            res.render('dashboard/index', {
                title: 'Dasboard',
                user: user,
                dashboardData: data.dashboardData
            });
        } catch (error) {

            console.error(`[DashboardController] Error getting dashboard data for user ${user.id}:`, error);
            res.render('dashboard/index', {
                user: user,
                title: 'Reg - AcademicVerify',
                countries: [],
                companyTypes: [],
                formData: {},
                errors: []
            });

        }
    }

    showProfile(req, res) {
        res.render('dashboard/profile', {
            title: 'Your Profile',
            user: req.session.user
        });
    }
}

module.exports = DashboardController;