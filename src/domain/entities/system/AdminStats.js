class AdminStats {
    constructor({
        totalUsers,
        activeUsers,
        totalVerifications,
        pendingVerifications,
        completedVerifications,
        totalRevenue,
        popularInstitutions,
        verificationTrends,
        systemHealth
    }) {
        this.totalUsers = totalUsers || 0;
        this.activeUsers = activeUsers || 0;
        this.totalVerifications = totalVerifications || 0;
        this.pendingVerifications = pendingVerifications || 0;
        this.completedVerifications = completedVerifications || 0;
        this.totalRevenue = totalRevenue || 0;
        this.popularInstitutions = popularInstitutions || [];
        this.verificationTrends = verificationTrends || {};
        this.systemHealth = systemHealth || {};
    }

    toJSON() {
        return {
            totalUsers: this.totalUsers,
            activeUsers: this.activeUsers,
            totalVerifications: this.totalVerifications,
            pendingVerifications: this.pendingVerifications,
            completedVerifications: this.completedVerifications,
            totalRevenue: this.totalRevenue,
            popularInstitutions: this.popularInstitutions,
            verificationTrends: this.verificationTrends,
            systemHealth: this.systemHealth,
            completionRate: this.getCompletionRate(),
            averageRevenuePerUser: this.getARPU()
        };
    }

    getCompletionRate() {
        if (this.totalVerifications === 0) return 0;
        return (this.completedVerifications / this.totalVerifications) * 100;
    }

    getARPU() {
        if (this.activeUsers === 0) return 0;
        return this.totalRevenue / this.activeUsers;
    }
}

module.exports = AdminStats;