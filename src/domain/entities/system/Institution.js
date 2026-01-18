// domain/entities/Institution.js

class Institution {
    constructor(data = {}) {
        // Basic Identifiers
        this.id = data.id || null;
        this.code = data.code || '';
        this.name = data.name || '';
        this.type = data.type || '';
        this.country = data.country || '';
        
        // New Descriptive Fields
        this.description = data.description || null;
        this.foundingDate = data.foundingDate || null;
        this.numberOfEmployees = data.numberOfEmployees || null;
        this.numberOfStudents = data.numberOfStudents || null;
        this.legalName = data.legalName || null;
        this.logo = data.logo || null;
        this.parentOrganization = data.parentOrganization || null;
        
        // Contact Information
        this.website = data.website || null;
        this.email = data.email || null;
        this.phone = data.phone || null;
        this.address = data.address || null;
        
        // Verification Process & Fees
        this.vfee = data.vfee || 0;
        this.process = data.process || 'manual';
        this.processingTime = data.processingTime || null;
        this.apiEndpoint = data.apiEndpoint || null;
        this.apiKey = data.apiKey || null;
        
        // System
        this.isActive = data.isActive !== undefined ? data.isActive : true;
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
    }

    static create(data) {
        return new Institution(data);
    }

    validate() {
        const errors = [];

        if (!this.code?.trim()) errors.push('Institution code is required');
        if (!this.name?.trim()) errors.push('Institution name is required');
        if (!this.country?.trim()) errors.push('Country is required');
        if (!this.type?.trim()) errors.push('Institution type is required');
        
        if (this.vfee < 0) errors.push('Verification fee cannot be negative');
        
        if (!['auto', 'manual'].includes(this.process)) {
            errors.push('Process type must be either "auto" or "manual"');
        }

        // Validate website format if provided
        if (this.website && !this.isValidUrl(this.website)) {
            errors.push('Website must be a valid URL');
        }

        // Validate email format if provided
        if (this.email && !this.isValidEmail(this.email)) {
            errors.push('Email must be a valid email address');
        }

        return errors;
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    activate() {
        this.isActive = true;
        this.updatedAt = new Date();
    }

    deactivate() {
        this.isActive = false;
        this.updatedAt = new Date();
    }

    updateFee(newFee) {
        if (newFee < 0) {
            throw new Error('Verification fee cannot be negative');
        }
        this.vfee = newFee;
        this.updatedAt = new Date();
    }

    updateProcessType(processType) {
        if (!['auto', 'manual'].includes(processType)) {
            throw new Error('Process type must be either "auto" or "manual"');
        }
        this.process = processType;
        this.updatedAt = new Date();
    }

    // New method to get display information for verification form
    getDisplayInfo() {
        return {
            name: this.name,
            code: this.code,
            country: this.country,
            type: this.type,
            vfee: this.vfee,
            process: this.process,
            processingTime: this.processingTime,
            website: this.website,
            description: this.description,
            numberOfStudents: this.numberOfStudents
        };
    }

    // New method to check if auto-verification is available
    supportsAutoVerification() {
        return this.process === 'auto' && this.apiEndpoint && this.apiKey;
    }

    toJSON() {
        return {
            // Basic Identifiers
            id: this.id,
            code: this.code,
            name: this.name,
            type: this.type,
            country: this.country,
            
            // Descriptive Fields
            description: this.description,
            foundingDate: this.foundingDate,
            numberOfEmployees: this.numberOfEmployees,
            numberOfStudents: this.numberOfStudents,
            legalName: this.legalName,
            logo: this.logo,
            parentOrganization: this.parentOrganization,
            
            // Contact Information
            website: this.website,
            email: this.email,
            phone: this.phone,
            address: this.address,
            
            // Verification Process & Fees
            vfee: this.vfee,
            process: this.process,
            processingTime: this.processingTime,
            apiEndpoint: this.apiEndpoint,
            apiKey: this.apiKey,
            
            // System
            isActive: this.isActive,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,

            // Computed properties
            supportsAutoVerification: this.supportsAutoVerification()
        };
    }
}

module.exports = Institution;