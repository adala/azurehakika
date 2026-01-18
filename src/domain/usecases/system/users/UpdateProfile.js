class GetProfile {
    constructor(systemUserRepository) {
        this.systemUserRepository = systemUserRepository;
    }

    async execute(id, userData) {
        const user = await this.systemUserRepository.update(userData, id);
        return user;
    }
}

module.exports = GetProfile;