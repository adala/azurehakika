// application/use_cases/institution/UpdateInstitution.js

const Institution = require('../../../entities/system/Institution');

class UpdateInstitution {
    constructor(institutionRepository) {
        this.institutionRepository = institutionRepository;
    }

    async execute(id, institutionData) {
        try {
            // Find existing institution
            const existingInstitution = await this.institutionRepository.findById(id);
            if (!existingInstitution) {
                throw new Error('Institution not found');
            }

            // Create updated institution entity
            const updatedData = { ...existingInstitution.toJSON(), ...institutionData };
            const institution = Institution.create(updatedData);

            // Validate institution
            const validationErrors = institution.validate();
            if (validationErrors.length > 0) {
                throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
            }

            // If code is being changed, check for duplicates
            if (institutionData.code && institutionData.code !== existingInstitution.code) {
                const duplicate = await this.institutionRepository.findByCode(institutionData.code);
                if (duplicate && duplicate.id !== parseInt(id)) {
                    throw new Error('Institution code already exists');
                }
            }

            // Update in repository
            const updatedInstitution = await this.institutionRepository.update(id, institution.toJSON());

            return updatedInstitution.toJSON();
        } catch (error) {
            console.error('Error updating institution:', error);
            throw error;
        }
    }
}

module.exports = UpdateInstitution;