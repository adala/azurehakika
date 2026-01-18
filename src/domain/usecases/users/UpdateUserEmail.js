
class UpdateUserEmail {

    constructor(userRepository, hashService, emailService) {
        this.userRepository = userRepository;
        this.hashService = hashService;
        this.emailService = emailService
    }
 
    async execute(id, email, password) {

        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new Error('User does not exist');
        }
        // Confirm password
        if (await this.hashService.compare(user.password, password)) {
            throw new Error('Invalid passowrd');
        }

        // Update email
        const result = await this.userRepository.update(user.id, { email: email, isVerified: false });

        // Send verification email to new address
        await this.emailService.sendVerificationEmail(email, user.id);

        return user.toJSON();

    }
}

module.exports = UpdateUserEmail