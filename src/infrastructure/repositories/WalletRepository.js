const IWalletRepository = require('../../domain/interfaces/IWalletRepository');
const Wallet = require('../database/models/Wallet');

class WalletRepository extends IWalletRepository {
    async findByUserId(userId) {
        let wallet = await Wallet.findOne({ where: { userId } });

        if (!wallet) {
            // Create wallet if it doesn't exist
            wallet = await this.create({ userId, balance: 0, currency: 'USD' });
        }

        return wallet;
    }

    async create(walletData) {
        return await Wallet.create(walletData);
    }

    async updateBalance(userId, amount) {
        const wallet = await this.findByUserId(userId);

        const newBalance = parseFloat(wallet.balance) + parseFloat(amount);

        const [affectedCount] = await Wallet.update(
            { balance: newBalance },
            { where: { userId } }
        );

        if (affectedCount === 0) {
            throw new Error('Wallet not found');
        }

        return await this.findByUserId(userId);
    }
}

module.exports = WalletRepository;