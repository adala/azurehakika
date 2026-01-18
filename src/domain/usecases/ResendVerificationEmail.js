
class ResendVerificationEmail {
    constructor(userRepository, emailService, hashService, configurationService) {
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    async execute(email) {
       
        // 1. Find the user by email
        const existingUser = await this.userRepository.findByEmail(email);
        if (!existingUser) {
            throw new Error('User with this email does not exist');
        }
   
        // 2. Send verification email
        await this.emailService.sendVerificationEmail(email, existingUser.id);
     
        return existingUser.toJSON();
    }
}

module.exports = ResendVerificationEmail;