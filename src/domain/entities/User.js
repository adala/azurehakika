class User {
    constructor({ id, firstName, surname, email, password, role, companyName, companyType, country, isVerified, createdAt, updatedAt, lastLogin }) {
        this.id = id;
        this.firstName = firstName;
        this.surname = surname;
        this.email = email;
        this.password = password;
        this.role = role;
        this.companyName = companyName;
        this.companyType = companyType;
        this.country = country;
        this.isVerified = isVerified || false;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.lastLogin = lastLogin;
    }

    validate() {
        const errors = [];

        if (!this.firstName || this.firstName.length < 2) {
            errors.push('First name must be at least 2 characters long');
        }

        if (!this.surname || this.surname.length < 2) {
            errors.push('Surname must be at least 2 characters long');
        }

        if (!this.email || !this.isValidEmail(this.email)) {
            errors.push('Valid email is required');
        }

        if (!this.password || this.password.length < 6) {
            errors.push('Password must be at least 6 characters long');
        }

        return errors;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    toJSON() {
        return {
            id: this.id,
            firstName: this.firstName,
            surname: this.surname,
            email: this.email,
            role: this.role,
            companyName: this.companyName,
            companyType: this.companyType,
            country: this.country,
            isVerified: this.isVerified,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            lastLogin: this.lastLogin
        };
    }
}

module.exports = User;