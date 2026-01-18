class DeleteTransaction {
  constructor(transactionRepository) {
    this.transactionRepository = transactionRepository;
  }

  async execute(id) {
    // Validate user ID
    if (!id) {
      throw new Error('Transaction ID is required');
    }

    // Get existing user
    const existingTransaction = await this.transactionRepository.findById(id);
    if (!existingTransaction) {
      throw new Error('Transaction not found');
    }

    // Delete user
    await this.transactionRepository.deleteTransaction(id);
    return { success: true };
  }
}

module.exports = DeleteTransaction;
