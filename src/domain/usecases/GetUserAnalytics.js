class GetUserAnalytics {
    constructor(analyticsRepository) {
        this.analyticsRepository = analyticsRepository;
    }

    async execute(userId, period = 'monthly') { 
        const analyticsData = await this.analyticsRepository.getUserAnalytics(userId, period);

        return new Analytics({
            userId,
            period,
            ...analyticsData
        }).toJSON();
    }
}

module.exports = GetUserAnalytics;