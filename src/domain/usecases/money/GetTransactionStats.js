class GetTransactionStats {
    constructor(transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    async execute(userId) {
        return await this.transactionRepository.getUserTransactionStats(userId);
    }
}

module.exports = GetTransactionStats;