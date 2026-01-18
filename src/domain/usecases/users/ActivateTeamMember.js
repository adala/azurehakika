class ActivateTeamMember {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    async execute(id) {
        const teamMember = await this.userRepository.activateMember(id);
        return teamMember.toJSON();
    }
}

module.exports = ActivateTeamMember;