// application/use_cases/institution/GetInstitutions.js

class GetInstitutions {
    constructor(institutionRepository) {
        this.institutionRepository = institutionRepository;
    }

    async execute(options = {}) {
        const { activeOnly = true, search = null } = options;

        try {
            let institutions;
            
            if (search) {
                institutions = await this.institutionRepository.search(search);
            } else if (activeOnly) {
                institutions = await this.institutionRepository.findActive();
            } else {
                institutions = await this.institutionRepository.listAll();
            }

            return institutions.map(inst => inst.toJSON());
        } catch (error) {
            console.error('Error getting institutions:', error);
            throw new Error('Failed to retrieve institutions');
        }
    }
}

module.exports = GetInstitutions;