class UpdateUserPassword {

    constructor(userRepository, hashService) {
        this.userRepository = userRepository;
        this.hashService = hashService;
    }

    async execute(id, currentPassword, newPassword) {
        
        // Check if user exist
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new Error('User does not exist');
        }

        // Verify current password
        if (await this.hashService.compare(user.password, currentPassword)) {
            throw new Error('Current password is incorrect');
        }

        // Update password
        const result = await this.userRepository.update(user.id, { password: newPassword });

        return user.toJSON();
    }
}

module.exports = UpdateUserPassword