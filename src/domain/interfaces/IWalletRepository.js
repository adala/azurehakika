class IWalletRepository {
    async findByUserId(userId) { throw new Error('Method not implemented'); }
    async create(wallet) { throw new Error('Method not implemented'); }
    async updateBalance(userId, amount) { throw new Error('Method not implemented'); }
}

module.exports = IWalletRepository;