class Wallet {
    constructor({ id, userId, balance, currency, createdAt, updatedAt }) {
        this.id = id;
        this.userId = userId;
        this.balance = balance || 0;
        this.currency = currency || 'USD';
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    canAfford(amount) {
        return this.balance >= amount;
    }

    deduct(amount) {
        if (!this.canAfford(amount)) {
            throw new Error('Insufficient balance');
        }
        this.balance -= amount;
    }

    add(amount) {
        if (amount <= 0) {
            throw new Error('Amount must be positive');
        }
        this.balance += amount;
    }

    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            balance: this.balance,
            currency: this.currency,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

module.exports = Wallet;