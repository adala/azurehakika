// application/use_cases/institution/GetInstitutionByCode.js

class GetInstitutionByCode {
    constructor(institutionRepository) {
        this.institutionRepository = institutionRepository;
    }

    async execute(code) {
        try {
            const institution = await this.institutionRepository.findByCode(code);
            
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