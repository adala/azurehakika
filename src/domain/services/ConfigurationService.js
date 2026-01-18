class Configuration {
    constructor(configurationRepository) {
        this.configurationRepository = configurationRepository;
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
    }

    async getCountries() {
        const cacheKey = 'countries';
        const cached = this.getFromCache(cacheKey);

        if (cached) {
            return cached;
        }

        const countries = await this.configurationRepository.getCountries();
        this.setToCache(cacheKey, countries);
        return countries;
    }

    async getCompanyTypes() {
        const cacheKey = 'companyTypes';
        const cached = this.getFromCache(cacheKey);

        if (cached) {
            return cached;
        }

        const companyTypes = await this.configurationRepository.getCompanyTypes();
        this.setToCache(cacheKey, companyTypes);
        return companyTypes;
    }

    async getInstitutions() { 
        const cacheKey = 'institutions';
        const cached = this.getFromCache(cacheKey);

        if (cached) {
            return cached;
        }

        const institutions = await this.configurationRepository.getInstitutions();
        
        this.setToCache(cacheKey, institutions);
       
        return institutions; 
    }

    async updateCountries(countries) {
        if (!Array.isArray(countries)) {
            throw new Error('Countries must be an array');
        }

        // Validate countries array
        const validCountries = countries.filter(country =>
            typeof country === 'string' && country.trim().length > 0
        );

        if (validCountries.length === 0) {
            throw new Error('At least one valid country is required');
        }

        const result = await this.configurationRepository.updateCountries(validCountries);
        this.clearCache('countries');
        return result;
    }

    async updateCompanyTypes(companyTypes) {
        if (!Array.isArray(companyTypes)) {
            throw new Error('Company types must be an array');
        }

        // Validate company types structure
        const validCompanyTypes = companyTypes.filter(type =>
            type &&
            typeof type.value === 'string' &&
            typeof type.label === 'string' &&
            type.value.trim().length > 0 &&
            type.label.trim().length > 0
        );

        if (validCompanyTypes.length === 0) {
            throw new Error('At least one valid company type is required');
        }

        const result = await this.configurationRepository.updateCompanyTypes(validCompanyTypes);
        this.clearCache('companyTypes');
        return result;
    }

    async getConfiguration(key) {
        const cached = this.getFromCache(key);
        if (cached) {
            return cached;
        }

        const config = await this.configurationRepository.findByKey(key);
        if (config) {
            this.setToCache(key, config.getParsedValue());
            return config.getParsedValue();
        }

        return null;
    }

    async setConfiguration(key, value, description = null, category = null) {
        const configData = {
            key,
            value: typeof value === 'string' ? value : JSON.stringify(value),
            description,
            category
        };

        const existing = await this.configurationRepository.findByKey(key);
        let result;

        if (existing) {
            result = await this.configurationRepository.update(key, configData);
        } else {
            result = await this.configurationRepository.create(configData);
        }

        this.clearCache(key);
        return result;
    }

    // Cache management
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.value;
        }
        this.cache.delete(key);
        return null;
    }

    setToCache(key, value) {
        this.cache.set(key, {
            value,
            timestamp: Date.now()
        });
    }

    clearCache(key = null) {
        if (key) {
            this.cache.delete(key);
        } else {
            this.cache.clear();
        }
    }

    // Helper methods for common configurations
    async getInstitutionSettings() {
        return await this.getConfiguration('institution.settings') || {
            autoVerificationEnabled: true,
            defaultProcessingTime: 7,
            maxFileSize: 10 * 1024 * 1024 // 10MB
        };
    }

    async getPaymentSettings() {
        return await this.getConfiguration('payment.settings') || {
            currency: 'USD',
            minimumTopup: 10,
            allowedMethods: ['momo', 'card']
        };
    }

    async getSystemSettings() {
        return await this.getConfiguration('system.settings') || {
            maintenanceMode: false,
            allowRegistrations: true,
            maxBulkRecords: 1000
        };
    }
}

module.exports = Configuration;