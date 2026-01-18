class GetBulkStats {
    constructor(bulkVerificationRepository) {
        this.bulkVerificationRepository = bulkVerificationRepository;
    }

    async execute(userId) {
        return await this.bulkVerificationRepository.getBulkStats(userId);
    }
}

module.exports = GetBulkStats;