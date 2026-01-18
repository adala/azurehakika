class VerifyOTP {
    constructor(userRepository, jwtService, sessionService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.sessionService = sessionService;
    }

    async execute(email, otp) {
        // Verify OTP
        const otpResult = this.sessionService.verifyOTP(email, otp);
        
        if (!otpResult.isValid) {
            throw new Error(otpResult.message);
        }

        // Get user
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new Error('User not found'); 
        }
 
        const updatedUser = await this.userRepository.update(user.id, {lastLogin: Date.now()})
       
        // Generate JWT token
        const token = this.jwtService.generateToken(updatedUser.toJSON(), '30m');
        
        return {
            token,
            user: updatedUser.toJSON()
        };
    }
}

module.exports = VerifyOTP; 