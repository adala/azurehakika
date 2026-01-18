class ITransactionRepository {
    async create(transactionData) { throw new Error('Method not implemented'); }
    async findByUserId(userId, limit) { throw new Error('Method not implemented'); }
    async findByReference(reference) { throw new Error('Method not implemented'); }
    async updateStatus(reference, status) { throw new Error('Method not implemented'); }
    async getBalance(userId) { throw new Error('Method not implemented'); }
    async findByType(userId, type, limit) { throw new Error('Method not implemented'); }
    async getRevenueStats(startDate, endDate) { throw new Error('Method not implemented'); }
    async getUserTransactionStats(userId) { throw new Error('Method not implemented'); }
}

module.exports = ITransactionRepository;