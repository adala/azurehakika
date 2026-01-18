class GetTransactions {
    constructor(transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    async execute(userId, limit = 50) {
        const transactions = await this.transactionRepository.findByUserId(userId, limit);
        return transactions.map(transaction => transaction.toJSON());
    }
}

module.exports = GetTransactions;