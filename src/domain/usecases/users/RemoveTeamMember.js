class ActivateTeamMember {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    async execute(id) {
        return await this.userRepository.delete(id);
    }
}

module.exports = ActivateTeamMember;