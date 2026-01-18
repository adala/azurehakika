// src/infrastructure/repositories/BaseRepository.js
class BaseRepository {
    constructor(model) {
        this.model = model;
    }

    async findById(id, options = {}) {
        return await this.model.findByPk(id, options);
    }

    async findAll(options = {}) {
        return await this.model.findAll(options);
    }

    async create(data) {
        return await this.model.create(data);
    }

    async update(id, data) {
        const instance = await this.findById(id);
        if (!instance) return null;
        return await instance.update(data);
    }

    async delete(id) {
        const instance = await this.findById(id);
        if (!instance) return null;
        await instance.destroy();
        return true;
    }
}