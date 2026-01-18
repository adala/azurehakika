class VerifyEmail {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    async execute(userId) {
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new Error('User not found');
        }

        if (user.isVerified) {
            throw new Error('User already verified');
        }

        user.isVerified = true;
        await this.userRepository.update(userId, { isVerified: true });

        return { message: 'Email verified successfully' };
    }
}

module.exports = VerifyEmail;