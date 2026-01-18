class GetUserById {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    async findUserById() {
        return await this.userRepository.findById();
    }
}

module.exports = GetUserById;