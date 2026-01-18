class SystemUser {
    constructor({
        id,
        username,
        email,
        password,
        firstName,
        lastName,
        role = 'worker',
        country,
        department,
        isActive = true,
        lastLoginAt,
        passwordChangedAt,
        failedLoginAttempts = 0,
        accountLockedUntil,
        mustChangePassword = false,
        createdAt,
        updatedAt
    }) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.password = password;
        this.firstName = firstName;
        this.lastName = lastName;
        this.role = role;
        this.country = country;
        this.department = department;
        this.isActive = isActive;
        this.lastLoginAt = lastLoginAt;
        this.passwordChangedAt = passwordChangedAt;
        this.failedLoginAttempts = failedLoginAttempts;
        this.accountLockedUntil = accountLockedUntil;
        this.mustChangePassword = mustChangePassword;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Business rules and methods
    hasPermission(requiredRole) {
        const roleHierarchy = {
            'worker': ['worker'],
            'supervisor': ['worker', 'supervisor'],
            'admin': ['worker', 'supervisor', 'admin']
        };
        return roleHierarchy[this.role]?.includes(requiredRole) || false;
    }

    canAssignTasks() {
        return this.role === 'supervisor' || this.role === 'admin';
    }

    canManageUsers() {
        return this.role === 'admin';
    }

    canManageSystem() {
        return this.role === 'admin';
    }

    getFullName() {
        return `${this.firstName} ${this.lastName}`;
    }

    isAccountCurrentlyLocked() {
        if (!this.accountLockedUntil) return false;
        return new Date() < new Date(this.accountLockedUntil);
    }

    shouldChangePassword() {
        return this.mustChangePassword || 
               (this.passwordChangedAt && this.isPasswordExpired());
    }

    isPasswordExpired() {
        if (!this.passwordChangedAt) return true;
        const passwordAge = Date.now() - new Date(this.passwordChangedAt).getTime();
        const ninetyDays = 90 * 24 * 60 * 60 * 1000; // 90 days in milliseconds
        return passwordAge > ninetyDays;
    }

    hasExceededFailedAttempts(maxAttempts = 5) {
        return this.failedLoginAttempts >= maxAttempts;
    }

    markAsActive() {
        this.isActive = true;
        return this;
    }

    markAsInactive() {
        this.isActive = false;
        return this;
    }

    updateLastLogin() {
        this.lastLoginAt = new Date();
        return this;
    }

    incrementFailedAttempts() {
        this.failedLoginAttempts += 1;
        
        // Auto-lock account after 5 failed attempts for 30 minutes
        if (this.failedLoginAttempts >= 5) {
            this.accountLockedUntil = new Date(Date.now() + 30 * 60 * 1000);
        }
        
        return this;
    }

    resetFailedAttempts() {
        this.failedLoginAttempts = 0;
        this.accountLockedUntil = null;
        return this;
    }

    changePassword(newPassword) {
        this.password = newPassword;
        this.passwordChangedAt = new Date();
        this.mustChangePassword = false;
        return this;
    }

    requirePasswordChange() {
        this.mustChangePassword = true;
        return this;
    }

    getRoleDisplayName() {
        const roleNames = {
            'admin': 'Administrator',
            'supervisor': 'Supervisor', 
            'worker': 'Worker'
        };
        return roleNames[this.role] || this.role;
    }

    getStatus() {
        if (!this.isActive) return 'inactive';
        if (this.isAccountCurrentlyLocked()) return 'locked';
        return 'active';
    }

    toSessionObject() {
        return {
            id: this.id,
            username: this.username,
            email: this.email,
            firstName: this.firstName,
            lastName: this.lastName,
            role: this.role,
            country: this.country,
            department: this.department,
            mustChangePassword: this.mustChangePassword,
            isActive: this.isActive
        };
    }

    validate() {
        const errors = [];
        
        if (!this.username || this.username.length < 3) {
            errors.push('Username must be at least 3 characters long');
        }
        
        if (!this.email || !this.isValidEmail(this.email)) {
            errors.push('Valid email is required');
        }
        
        if (!this.firstName || this.firstName.trim().length === 0) {
            errors.push('First name is required');
        }
        
        if (!this.lastName || this.lastName.trim().length === 0) {
            errors.push('Last name is required');
        }
        
        if (!['admin', 'supervisor', 'worker'].includes(this.role)) {
            errors.push('Invalid role specified');
        }
        
        return errors;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Factory method to create a new system user
    static create({ username, email, password, firstName, lastName, role, department }) {
        return new SystemUser({
            username,
            email,
            password,
            firstName,
            lastName,
            role,
            department,
            country,
            isActive: true,
            mustChangePassword: true, // Require password change on first login
            failedLoginAttempts: 0
        });
    }

    // Factory method to create admin user
    static createAdmin({ username, email, password, firstName, lastName, department, country }) {
        return this.create({
            username,
            email,
            password,
            firstName,
            lastName,
            role: 'admin',
            department, 
            country
        });
    }

    // Factory method to create supervisor user
    static createSupervisor({ username, email, password, firstName, lastName, department, country }) {
        return this.create({
            username,
            email,
            password,
            firstName,
            lastName,
            role: 'supervisor',
            department,
            country
        });
    }

    // Factory method to create worker user
    static createWorker({ username, email, password, firstName, lastName, department }) {
        return this.create({
            username,
            email,
            password,
            firstName,
            lastName,
            role: 'worker',
            department
        });
    }
} 

module.exports = SystemUser;