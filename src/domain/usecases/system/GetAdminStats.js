class GetAdminStats {
    constructor(analyticsRepository) {
        this.analyticsRepository = analyticsRepository;
    }

    async execute() {
        const statsData = await this.analyticsRepository.getAdminStats();
        return new AdminStats(statsData).toJSON();
    }
}

module.exports = GetAdminStats;