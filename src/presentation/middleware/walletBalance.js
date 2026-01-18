// middleware/walletBalance.js
const Wallet = require('../../domain/entities/Wallet');

class WalletBalanceMiddleware {
    constructor() {
        this.minimumBalance = this.getMinimumBalance();
    }

    getMinimumBalance() {
        // Get minimum balance from environment with fallback
        const minBalance = parseFloat(process.env.MIN_WALLET_BALANCE) || 10.00;
        const minVerificationBalance = parseFloat(process.env.MIN_VERIFICATION_BALANCE) || 50.00;
        
        return {
            wallet: minBalance,
            verification: minVerificationBalance,
            currency: process.env.CURRENCY || 'USD'
        };
    }

    // Main middleware to set wallet balance in response locals
    async setWalletBalance(req, res, next) {
        try {
            if (!req.user || !req.user.id) {
                res.locals.walletBalance = 0;
                return next();
            }

            // Get wallet balance from database
            const wallet = await Wallet.findOne({ 
                where: { userId: req.user.id },
                attributes: ['id', 'balance', 'currency', 'updatedAt']
            });

            const balance = wallet ? parseFloat(wallet.balance) : 0;
            
            // Set in response locals for use in views
            res.locals.walletBalance = balance;
            res.locals.wallet = wallet;
            res.locals.minBalance = this.minimumBalance.wallet;
            res.locals.minverification = this.minimumBalance.verification;
            console.log(this.minimumBalance.wallet);
            // Also set in request for use in controllers
            req.walletBalance = balance;
            req.wallet = wallet;

            next();
        } catch (error) {
            console.error('Wallet balance middleware error:', error);
            // Set default values on error
            res.locals.walletBalance = 0;
            next();
        }
    }

    // Middleware to check if user has sufficient funds
    checkSufficientFunds(requiredAmount = null) {
        return async (req, res, next) => {
            try {
                const amount = requiredAmount || this.minimumBalance.verification;
                const balance = req.walletBalance || 0;

                if (balance < amount) {
                    return res.status(402).json({
                        success: false,
                        message: `Insufficient funds. Required: ${this.minimumBalance.currency} ${amount}, Available: ${this.minimumBalance.currency} ${balance}`,
                        code: 'INSUFFICIENT_FUNDS',
                        data: {
                            required: amount,
                            available: balance,
                            currency: this.minimumBalance.currency
                        }
                    });
                }

                req.requiredAmount = amount;
                next();
            } catch (error) {
                console.error('Check funds middleware error:', error);
                res.status(500).json({
                    success: false,
                    message: 'Error checking wallet balance'
                });
            }
        };
    }

    // Middleware for low balance warnings
    checkLowBalance() {
        return (req, res, next) => {
            const balance = req.walletBalance || 0;
            const warningThreshold = this.minimumBalance.verification * 1.5; // 1.5x verification cost
            
            if (balance < warningThreshold) {
                res.locals.balanceWarning = {
                    show: true,
                    message: `Low balance warning: ${this.minimumBalance.currency} ${balance}`,
                    recommended: this.minimumBalance.verification * 3, // Recommend 3x verification cost
                    current: balance
                };
            } else {
                res.locals.balanceWarning = { show: false };
            }
            
            next();
        };
    }

    // Get balance information object
    getBalanceInfo(balance) {
        const status = this.getBalanceStatus(balance);
        
        return {
            balance: balance,
            currency: this.minimumBalance.currency,
            status: status,
            minimum: this.minimumBalance.wallet,
            verificationMinimum: this.minimumBalance.verification,
            isSufficient: balance >= this.minimumBalance.verification,
            isLow: balance < this.minimumBalance.verification,
            formatted: `${this.minimumBalance.currency} ${balance.toFixed(2)}`,
            formattedMinimum: `${this.minimumBalance.currency} ${this.minimumBalance.wallet.toFixed(2)}`
        };
    }

    // Determine balance status
    getBalanceStatus(balance) {
        if (balance >= this.minimumBalance.verification * 3) {
            return 'excellent';
        } else if (balance >= this.minimumBalance.verification) {
            return 'sufficient';
        } else if (balance >= this.minimumBalance.verification * 0.5) {
            return 'low';
        } else {
            return 'critical';
        }
    }

    // API endpoint to get wallet balance
    async getBalanceAPI(req, res) {
        try {
            const balance = req.walletBalance || 0;
            
            res.json({
                success: true,
                data: {
                    balance: balance,
                    ...this.getBalanceInfo(balance),
                    transactions: await this.getRecentTransactions(req.user.id)
                }
            });
        } catch (error) {
            console.error('Get balance API error:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching wallet balance'
            });
        }
    }

    // Get recent transactions for dashboard
    async getRecentTransactions(userId, limit = 5) {
        try {
            const transactions = await Transaction.findAll({
                where: { userId },
                order: [['createdAt', 'DESC']],
                limit: limit,
                attributes: ['id', 'type', 'amount', 'description', 'reference', 'status', 'createdAt']
            });

            return transactions.map(txn => ({
                id: txn.id,
                type: txn.type,
                amount: parseFloat(txn.amount),
                description: txn.description,
                reference: txn.reference,
                status: txn.status,
                date: txn.createdAt,
                formattedAmount: `${txn.type === 'CREDIT' ? '+' : '-'}${this.minimumBalance.currency} ${Math.abs(parseFloat(txn.amount)).toFixed(2)}`,
                isCredit: txn.type === 'CREDIT'
            }));
        } catch (error) {
            console.error('Get recent transactions error:', error);
            return [];
        }
    }
}

// Create singleton instance
const walletMiddleware = new WalletBalanceMiddleware();

module.exports = walletMiddleware;