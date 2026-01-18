class GetProfile {
    constructor(systemUserRepository) {
        this.systemUserRepository = systemUserRepository;
    }

    async execute(userId) {
        const user = await this.systemUserRepository.findById(userId);
        return user;
    }
}

module.exports = GetProfile;