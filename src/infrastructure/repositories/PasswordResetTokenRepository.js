// repositories/PasswordResetTokenRepository.js
const PasswordResetTokenEntity = require('../../domain/entities/PasseordResetToken');

class PasswordResetTokenRepository {
    constructor(PasswordResetToken) {
        this.PasswordResetToken = PasswordResetToken;
    }

    async create(resetTokenData) {
        try {
            const resetToken = await this.PasswordResetToken.create(resetTokenData);
            return PasswordResetTokenEntity.fromModel(resetToken);
        } catch (error) {
            throw new Error(`Failed to create password reset token: ${error.message}`);
        }
    }

    async findByToken(token) {
        try {
            const resetToken = await this.PasswordResetToken.findOne({
                where: { token }
            });
            return PasswordResetTokenEntity.fromModel(resetToken);
        } catch (error) {
            throw new Error(`Failed to find password reset token: ${error.message}`);
        }
    }

    async findByUserId(userId) {
        try {
            const resetToken = await this.PasswordResetToken.findOne({
                where: { userId }
            });
            return PasswordResetTokenEntity.fromModel(resetToken);
        } catch (error) {
            throw new Error(`Failed to find password reset token by user ID: ${error.message}`);
        }
    }

    async update(token, updateData) {
        try {
            const [affectedRows] = await this.PasswordResetToken.update(updateData, {
                where: { token }
            });

            if (affectedRows === 0) {
                return null;
            }

            const updatedToken = await this.findByToken(token);
            return updatedToken;
        } catch (error) {
            throw new Error(`Failed to update password reset token: ${error.message}`);
        }
    }

    async markAsUsed(token) {
        return await this.update(token, {
            used: true,
            updatedAt: new Date()
        });
    }

    async deleteByUserId(userId) {
        try {
            const result = await this.PasswordResetToken.destroy({
                where: { userId }
            });
            return result;
        } catch (error) {
            throw new Error(`Failed to delete password reset tokens: ${error.message}`);
        }
    }

    async deleteExpiredTokens() {
        try {
            const result = await this.PasswordResetToken.destroy({
                where: {
                    expiresAt: {
                        [this.PasswordResetToken.sequelize.Op.lt]: new Date()
                    }
                }
            });
            return result;
        } catch (error) {
            throw new Error(`Failed to delete expired tokens: ${error.message}`);
        }
    }

    async isValidToken(token) {
        try {
            const resetToken = await this.findByToken(token);
            return resetToken ? resetToken.isValid() : false;
        } catch (error) {
            throw new Error(`Failed to validate token: ${error.message}`);
        }
    }
}

module.exports = PasswordResetTokenRepository;