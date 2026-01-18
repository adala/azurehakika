// domain/interfaces/IInstitutionRepository.js

class IInstitutionRepository {
    async create(institutionData) {
        throw new Error('Method not implemented');
    }

    async findById(id) {
        throw new Error('Method not implemented');
    }

    async findByCode(code) {
        throw new Error('Method not implemented');
    }

    async findByName(name) {
        throw new Error('Method not implemented');
    }

    async findByCountry(country) {
        throw new Error('Method not implemented');
    }

    async findByType(type) {
        throw new Error('Method not implemented');
    }

    async findActive() {
        throw new Error('Method not implemented');
    }

    async update(id, institutionData) {
        throw new Error('Method not implemented');
    }

    async delete(id) {
        throw new Error('Method not implemented');
    }

    async listAll() {
        throw new Error('Method not implemented');
    }

    async search(query) {
        throw new Error('Method not implemented');
    }
}

module.exports = IInstitutionRepository;