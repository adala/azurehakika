// infrastructure/repositories/InstitutionRepository.js

const IInstitutionRepository = require('../../domain/interfaces/IInstitutionRepository');
const sequelize = require('../../../config/database');
const Institution = require('../database/models/system/Institution');
const { Op } = require('sequelize');

class InstitutionRepository extends IInstitutionRepository {
    async create(institutionData) {
        const institution = await Institution.create(institutionData);
        return institution;
    }

    async findById(id) {
        return await Institution.findByPk(id);
    }

    async findByCode(code) {
        return await Institution.findOne({
            where: { code }
        });
    }

    async findByName(name) {
        return await Institution.findOne({
            where: { name }
        });
    }

    async findByCountry(country) {
        return await Institution.findAll({
            where: { country }
        });
    }

    async findByType(type) {
        return await Institution.findAll({
            where: { type }
        });
    }

    async findActive() {
        return await Institution.findAll({
            where: { isActive: true },
            order: [['name', 'ASC']]
        });
    }

    async update(id, institutionData) {
        const [affectedCount] = await Institution.update(institutionData, {
            where: { id }
        });

        if (affectedCount === 0) {
            throw new Error('Institution not found');
        }

        return await this.findById(id);
    }

    async delete(id) {
        const affectedCount = await Institution.destroy({
            where: { id }
        });

        if (affectedCount === 0) {
            throw new Error('Institution not found');
        }

        return true;
    }

    async listAll() {
        return await Institution.findAll({
            order: [['name', 'ASC']]
        });
    }

    async search(query) {
        return await Institution.findAll({
            where: {
                [Op.or]: [
                    { name: { [Op.iLike]: `%${query}%` } },
                    { code: { [Op.iLike]: `%${query}%` } },
                    { country: { [Op.iLike]: `%${query}%` } }
                ],
                isActive: true
            },
            order: [['name', 'ASC']]
        });
    }

    async count() {
        return await Institution.count();
    }

    async countActive() {
        return await Institution.count({
            where: { isActive: true }
        });
    }
}

module.exports = InstitutionRepository;