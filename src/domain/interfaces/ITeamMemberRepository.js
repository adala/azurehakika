class ITeamMemberRepository {
    async create(teamMemberData) { throw new Error('Method not implemented'); }
    async findByTeamId(teamId) { throw new Error('Method not implemented'); }
    async findByEmailAndTeamId(email, teamId) { throw new Error('Method not implemented'); }
    async findById(id) { throw new Error('Method not implemented'); }
    async update(id, teamMemberData) { throw new Error('Method not implemented'); }
    async delete(id) { throw new Error('Method not implemented'); }
    async activateMember(id, userId) { throw new Error('Method not implemented'); }
    async findByUserId(userId) { throw new Error('Method not implemented'); }
}

module.exports = ITeamMemberRepository;