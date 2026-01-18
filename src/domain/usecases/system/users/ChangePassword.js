
class ChangePassword {
    constructor(systemUserRepository){
        this.systemUserRepository = systemUserRepository;
    }
    async execute(userId, currentPassword, newPassword, confirmPassword) {
        // Validate inputs
        if (newPassword !== confirmPassword) {
            throw new Error('New passwords do not match');
        }

        if (newPassword.length < 8) {
            throw new Error('Password must be at least 8 characters long');
        }

        // Get user
        const user = await this.systemUserRepository.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Verify current password
       
        const isValid = await user.validatePassword(currentPassword);
        if (!isValid) {
            throw new Error('Current password is incorrect');
        }

        // Check if new password is same as old
        const isSame = await user.validatePassword(newPassword);
        if (isSame) {
            throw new Error('New password cannot be the same as current password');
        }

        // Update password
        await this.systemUserRepository.update(userId, {
            password: newPassword,
            mustChangePassword: false
        });

        return {
            success: true,
            message: 'Password changed successfully'
        };
    }
}

module.exports = ChangePassword;