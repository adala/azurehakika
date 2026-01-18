class SessionService {
    constructor() {
        this.otpStorage = new Map();
    }

    storeOTP(email, otp) {
        const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
        this.otpStorage.set(email, { otp, expiresAt });
    }

    verifyOTP(email, otp) {
        const stored = this.otpStorage.get(email);

        if (!stored) {
            return { isValid: false, message: 'OTP not found' };
        }

        if (Date.now() > stored.expiresAt) {
            this.otpStorage.delete(email);
            return { isValid: false, message: 'OTP expired' };
        }
        

        if (stored.otp !== otp) {
            return { isValid: false, message: 'Invalid OTP' };
        }

        this.otpStorage.delete(email);
        return { isValid: true, message: 'OTP verified successfully' };
    }

    cleanupExpiredOTPs() {
        const now = Date.now();
        for (const [email, data] of this.otpStorage.entries()) {
            if (now > data.expiresAt) {
                this.otpStorage.delete(email);
            }
        }
    }
}

module.exports = SessionService;