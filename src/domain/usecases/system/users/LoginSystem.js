
class LoginSystem {
    constructor(systemUserRepository,){
        this.systemUserRepository = systemUserRepository
    }
    async execute(username, password) {
        // Check if account is locked
        const user = await this.systemUserRepository.findByUsername(username);
     
        if (!user) {
            throw new Error('Invalid credentials'); 
        }
        
        // Check if account is locked
        const isLocked = await this.systemUserRepository.isAccountLocked(user.id);
        if (isLocked) {
            throw new Error('Account is temporarily locked due to too many failed login attempts');
        }

        // Validate credentials
        const authenticatedUser = await this.systemUserRepository.findByCredentials(username, password);
        if (!authenticatedUser) {
            // Increment failed attempts
            await this.systemUserRepository.incrementFailedAttempts(user.id);
            throw new Error('Invalid credentials');
        }

        // Check if password needs to be changed
        if (authenticatedUser.mustChangePassword) {
            throw new Error('Password change required');
        }

        // Reset failed attempts
        await this.systemUserRepository.resetFailedAttempts(authenticatedUser.id);
        
        // Update last login
        await this.systemUserRepository.updateLastLogin(authenticatedUser.id);

        return {
            id: authenticatedUser.id,
            username: authenticatedUser.username,
            email: authenticatedUser.email,
            firstName: authenticatedUser.firstName,
            lastName: authenticatedUser.lastName,
            role: authenticatedUser.role,
            department: authenticatedUser.department,
            mustChangePassword: authenticatedUser.mustChangePassword
        };
    }
}

module.exports = LoginSystem;