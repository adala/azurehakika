class IAssignmentRepository {
    async create(assignment) { throw new Error('Not implemented'); }
    async findByAssignee(assigneeId) { throw new Error('Not implemented'); }
    async findByAssigneeAndStatus(assigneeId, status) { throw new Error('Not implemented'); }
    async updateStatus(id, status) { throw new Error('Not implemented'); }
    async findByVerificationId(verificationId) { throw new Error('Not implemented'); }
}

module.exports = IAssignmentRepository;