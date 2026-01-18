class IVerificationRepository {
    async create(verification) { throw new Error('Method not implemented'); }
    async findByUserId(userId) { throw new Error('Method not implemented'); }
    async findById(id) { throw new Error('Method not implemented'); }
    async updateStatus(id, status, aiAgentResponse) { throw new Error('Method not implemented'); }
    async findByStatus(userId, status) { throw new Error('Method not implemented'); }
}

module.exports = IVerificationRepository;