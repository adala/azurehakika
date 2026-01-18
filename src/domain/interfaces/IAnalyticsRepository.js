class IAnalyticsRepository {
    async getUserAnalytics(userId, period) { throw new Error('Method not implemented'); }
    async getAdminStats() { throw new Error('Method not implemented'); }
    async getVerificationTrends(days) { throw new Error('Method not implemented'); }
    async getRevenueAnalytics(period) { throw new Error('Method not implemented'); }
}

module.exports = IAnalyticsRepository;