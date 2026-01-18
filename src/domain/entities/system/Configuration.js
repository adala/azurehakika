class Configuration {
    constructor({ id, key, value, description, isActive, createdAt, updatedAt }) {
        this.id = id;
        this.key = key;
        this.value = value;
        this.description = description;
        this.isActive = isActive !== undefined ? isActive : true;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    validate() {
        const errors = [];

        if (!this.key || this.key.length < 2) {
            errors.push('Configuration key must be at least 2 characters long');
        }

        if (this.value === undefined || this.value === null) {
            errors.push('Configuration value is required');
        }

        return errors;
    }

    getParsedValue() {
        try {
            return JSON.parse(this.value);
        } catch (error) {
            return this.value;
        }
    }

    toJSON() {
        return {
            id: this.id,
            key: this.key,
            value: this.getParsedValue(),
            description: this.description,
            isActive: this.isActive,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

module.exports = Configuration;