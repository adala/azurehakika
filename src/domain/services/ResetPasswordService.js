// services/PasswordResetService.js
class PasswordResetService {
    constructor(passwordResetRepository) {
        this.passwordResetRepository = passwordResetRepository;
    }

    async createResetToken(userId, token, expiry) {
        // Delete any existing reset tokens for this user
        await this.passwordResetRepository.deleteByUserId(userId);

        // Create new reset token
        return await this.passwordResetRepository.create({
            userId,
            token,
            expiresAt: new Date(expiry),
            used: false
        });
    }

    async validateResetToken(token) {
        const resetRequest = await this.passwordResetRepository.findByToken(token);
        
        if (!resetRequest) {
            return null;
        }

        // Check if token is expired or already used
        if (resetRequest.used || resetRequest.expiresAt < new Date()) {
            return null;
        }

        return resetRequest;
    }

    async markTokenAsUsed(token) {
        return await this.passwordResetRepository.update(token, { used: true });
    }

    async deleteByUserId(userId) {
        return await this.passwordResetRepository.deleteByUserId(userId);
    }
}

module.exports = PasswordResetService;