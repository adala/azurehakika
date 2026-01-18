class TeamMember {
    constructor({ id, userId, email, role, permissions, isActive, invitedAt, joinedAt, createdAt, updatedAt }) {
        this.id = id;
        this.userId = userId;
        this.email = email;
        this.role = role || 'member';
        this.permissions = permissions || ['view_verifications'];
        this.isActive = isActive || false;
        this.invitedAt = invitedAt;
        this.joinedAt = joinedAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    validate() {
        const errors = [];

        if (!this.email || !this.isValidEmail(this.email)) {
            errors.push('Valid email is required');
        } 

        if (!this.role || !['member', 'viewer'].includes(this.role)) {
            errors.push('Valid role is required');
        }

        return errors;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    hasPermission(permission) {
        return this.permissions.includes(permission);
    }

    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            email: this.email,
            role: this.role,
            permissions: this.permissions,
            isActive: this.isActive,
            invitedAt: this.invitedAt,
            joinedAt: this.joinedAt,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

module.exports = TeamMember;