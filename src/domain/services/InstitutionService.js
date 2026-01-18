// application/services/ConfigurationService.js

class ConfigurationService {
    constructor(getInstitutionsUseCase) {
        this.getInstitutionsUseCase = getInstitutionsUseCase;
    }

    async getInstitutions(options = {}) {
        try {
            const institutions = await this.getInstitutionsUseCase.execute(options);
            
            // Return institutions with all fields for admin use
            // For public use, you might want to filter sensitive fields like apiKey
            return institutions.map(inst => ({
                // Basic Identifiers
                id: inst.id,
                code: inst.code,
                name: inst.name,
                type: inst.type,
                country: inst.country,
                
                // Descriptive Fields (for display)
                description: inst.description,
                foundingDate: inst.foundingDate,
                numberOfStudents: inst.numberOfStudents,
                logo: inst.logo,
                
                // Contact Information
                website: inst.website,
                email: inst.email,
                phone: inst.phone,
                address: inst.address,
                
                // Verification Process & Fees
                vfee: inst.vfee,
                process: inst.process,
                processingTime: inst.processingTime,
                
                // System
                isActive: inst.isActive
            }));
        } catch (error) {
            console.error('Error getting institutions:', error);
            throw error;
        }
    }

    async getInstitutionByCode(code) {
        // This would use a getInstitutionByCode use case
        // Implementation depends on your existing structure
        const institutions = await this.getInstitutions();
        return institutions.find(inst => inst.code === code);
    }

    // Helper method for verification form
    async getInstitutionsForVerification() {
        return await this.getInstitutions({ activeOnly: true });
    }

    // Helper method for admin panel (includes all fields)
    async getInstitutionsForAdmin() {
        const institutions = await this.getInstitutionsUseCase.execute({ activeOnly: false });
        return institutions; // Return all fields including apiEndpoint, apiKey, etc.
    }
}

module.exports = ConfigurationService;