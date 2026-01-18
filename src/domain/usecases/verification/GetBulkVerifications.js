class GetBulkVerifications {
    constructor(bulkVerificationRepository) {
        this.bulkVerificationRepository = bulkVerificationRepository;
    }

    async execute(userId, limit = 20) {
        const bulkVerifications = await this.bulkVerificationRepository.findByUserId(userId, limit);
        return bulkVerifications.map(bulk => bulk.toJSON());
    }
}

module.exports = GetBulkVerifications;