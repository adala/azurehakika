class IBulkVerificationRepository {
    async create(bulkVerificationData) { throw new Error('Method not implemented'); }
    async findById(id) { throw new Error('Method not implemented'); }
    async findByUserId(userId, limit) { throw new Error('Method not implemented'); }
    async updateProgress(id, processedRecords) { throw new Error('Method not implemented'); }
    async updateStatus(id, status) { throw new Error('Method not implemented'); }
    async addResult(id, result) { throw new Error('Method not implemented'); }
    async incrementSuccessCount(id) { throw new Error('Method not implemented'); }
    async incrementFailedCount(id) { throw new Error('Method not implemented'); }
    async getBulkStats(userId) { throw new Error('Method not implemented'); }
    async findPendingBulkVerifications() { throw new Error('Method not implemented'); }
    async deleteBulkVerification(id) { throw new Error('Method not implemented'); }
    async searchBulkVerifications(userId, criteria) { throw new Error('Method not implemented'); }
}

module.exports = IBulkVerificationRepository;