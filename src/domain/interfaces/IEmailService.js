class IEmailService {
    async sendOTP(email, otp) { throw new Error('Method not implemented'); }
    async sendVerificationEmail(email, token) { throw new Error('Method not implemented'); }
    async sendVerificationRequestEmail(email, processingTime) { throw new Error('Method not implemented'); }
}

module.exports = IEmailService;