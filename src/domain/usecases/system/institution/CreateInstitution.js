// application/use_cases/institution/CreateInstitution.js

const Institution = require('../../../entities/system/Institution');

class CreateInstitution {
    constructor(institutionRepository) {
        this.institutionRepository = institutionRepository;
    }

    async execute(institutionData) {
        try {
            // Create institution entity
            const institution = Institution.create(institutionData);

            // Validate institution
            const validationErrors = institution.validate();
            if (validationErrors.length > 0) {
                throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
            }

            // Check if institution code already exists
            const existingInstitution = await this.institutionRepository.findByCode(institution.code);
            if (existingInstitution) {
                throw new Error('Institution code already exists');
            }

            // Save to repository
            const createdInstitution = await this.institutionRepository.create(institution.toJSON());

            return createdInstitution.toJSON();
        } catch (error) {
            console.error('Error creating institution:', error);
            throw error;
        }
    }
}

module.exports = CreateInstitution;