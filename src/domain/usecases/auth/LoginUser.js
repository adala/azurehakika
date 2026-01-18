class LoginUser {
    constructor(userRepository, hashService, jwtService, emailService, sessionService) {
        this.userRepository = userRepository;
        this.hashService = hashService;
        this.jwtService = jwtService;
        this.emailService = emailService;
        this.sessionService = sessionService;
    }

    async execute(email) {
        // Find user by email
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new Error('Invalid email or password');
        }

        // Verify password
        // const isPasswordValid = await this.hashService.compare(password, user.password);
        // if (!isPasswordValid) {
        //     throw new Error('Invalid email or password');
        // }

        // Check if user is verified
        if (!user.isVerified) {
            throw new Error('Please verify your email before logging in');
        }

        if (user.role != 'admin') {
            // Generate OTP and send via email
            const otp = this.jwtService.generateOTP();
            console.log('The OTP code is:', otp);
            this.sessionService.storeOTP(email, otp);
           // await this.emailService.sendOTP(email, otp);
        }
        return user.role === 'admin' ? {requiresOTP: false } : {
            message: 'OTP sent to your email',
            requiresOTP: true
        };

    }
}

module.exports = LoginUser;