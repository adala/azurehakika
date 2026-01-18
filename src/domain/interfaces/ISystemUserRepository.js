class ISystemUserRepository {
    async create(user) { throw new Error('Not implemented'); }
    async findById(id) { throw new Error('Not implemented'); }
    async findByEmail(email) { throw new Error('Not implemented'); }
    async findByRole(role) { throw new Error('Not implemented'); }
    async update(id, updates) { throw new Error('Not implemented'); }
    async findAll() { throw new Error('Not implemented'); }
}

module.exports = ISystemUserRepository;