class GetWalletBalance {
    constructor(walletRepository) {
        this.walletRepository = walletRepository;
    }

    async execute(userId) {
        const wallet = await this.walletRepository.findByUserId(userId);
        return wallet.toJSON();
    }
}

module.exports = GetWalletBalance;