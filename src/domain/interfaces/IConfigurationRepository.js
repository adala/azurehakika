class IConfigurationRepository {
    async findByKey(key) { throw new Error('Method not implemented'); }
    async create(configurationData) { throw new Error('Method not implemented'); }
    async update(key, configurationData) { throw new Error('Method not implemented'); }
    async delete(key) { throw new Error('Method not implemented'); }
    async findAllActive() { throw new Error('Method not implemented'); }
    async findByCategory(category) { throw new Error('Method not implemented'); }
}

module.exports = IConfigurationRepository;