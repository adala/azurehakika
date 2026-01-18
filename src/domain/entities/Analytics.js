class Analytics {
    constructor({
        id,
        userId,
        period,
        totalVerifications,
        completedVerifications,
        pendingVerifications,
        totalSpent,
        institutionBreakdown,
        createdAt
    }) {
        this.id = id;
        this.userId = userId;
        this.period = period; // 'daily', 'weekly', 'monthly'
        this.totalVerifications = totalVerifications || 0;
        this.completedVerifications = completedVerifications || 0;
        this.pendingVerifications = pendingVerifications || 0;
        this.totalSpent = totalSpent || 0;
        this.institutionBreakdown = institutionBreakdown || {};
        this.createdAt = createdAt;
    }

    getSuccessRate() {
        if (this.totalVerifications === 0) return 0;
        return (this.completedVerifications / this.totalVerifications) * 100;
    }

    getAverageCost() {
        if (this.totalVerifications === 0) return 0;
        return this.totalSpent / this.totalVerifications;
    }

    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            period: this.period,
            totalVerifications: this.totalVerifications,
            completedVerifications: this.completedVerifications,
            pendingVerifications: this.pendingVerifications,
            totalSpent: this.totalSpent,
            institutionBreakdown: this.institutionBreakdown,
            successRate: this.getSuccessRate(),
            averageCost: this.getAverageCost(),
            createdAt: this.createdAt
        };
    }
}

module.exports = Analytics;