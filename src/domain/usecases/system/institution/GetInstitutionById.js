// application/use_cases/institution/GetInstitutionByCode.js

class GetInstitutionByCode {
    constructor(institutionRepository) {
        this.institutionRepository = institutionRepository;
    }

    async execute(id) {
        try {
            const institution = await this.institutionRepository.findById(id);
            
            if (!institution) {
                throw new Error('Institution not found');
            }

            return institution.toJSON();
        } catch (error) {
            console.error('Error getting institution by code:', error);
            throw error;
        }
    }
}

module.exports = GetInstitutionByCode;