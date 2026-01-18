class LoginUser {
    constructor(userRepository, hashService) {
        this.userRepository = userRepository;
        this.hashService = hashService;
    }

    async execute(email, password) {
        // Find user by email
         const user = await this.userRepository.findByEmail(email);
         cons

        // Check if user is verified
        if (!user.isVerified) {
            throw new Error('Please verify your email before logging in');
        }

        // Check if password is valid
        if (!user) {
            throw new Error('Invalid email or password');
        }

        // Verify password
        const isPasswordValid = await this.hashService.compare(password, user.password);
        if (!isPasswordValid) {
            throw new Error('Invalid email or password');
        }

        console.log(user);
        return user;
    }
}

module.exports = LoginUser;