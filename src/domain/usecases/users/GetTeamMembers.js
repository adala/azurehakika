class GetTeamMembers {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    async execute(company, role) {
        const teamMembers = await this.userRepository.findTeamMembers(company, role);
        return teamMembers.map(member => member.toJSON());
    }
}

module.exports = GetTeamMembers;