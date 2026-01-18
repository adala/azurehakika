const IConfigurationRepository = require('../../domain/interfaces/IConfigurationRepository');
const Configuration = require('../database/models/Configuration');

class ConfigurationRepository extends IConfigurationRepository {
    async findByKey(key) {
        return await Configuration.findOne({
            where: { key, isActive: true }
        });
    }

    async create(configurationData) {
        return await Configuration.create(configurationData);
    }

    async update(key, configurationData) {
        const [affectedCount] = await Configuration.update(configurationData, {
            where: { key }
        });

        if (affectedCount === 0) {
            throw new Error('Configuration not found');
        }

        return await this.findByKey(key);
    }

    async delete(key) {
        const affectedCount = await Configuration.destroy({
            where: { key }
        });

        if (affectedCount === 0) {
            throw new Error('Configuration not found');
        }

        return true;
    }

    async findAllActive() {
        return await Configuration.findAll({
            where: { isActive: true },
            order: [['key', 'ASC']]
        });
    }

    async findByCategory(category) {
        return await Configuration.findAll({
            where: {
                key: { [Sequelize.Op.like]: `${category}.%` },
                isActive: true
            },
            order: [['key', 'ASC']]
        });
    }

    async getCountries() {
        const config = await this.findByKey('countries.list');
        if (!config) {
            return this.getDefaultCountries();
        }
        return config.getParsedValue();
    }

    async getCompanyTypes() {
        const config = await this.findByKey('company.types');
        if (!config) {
            return this.getDefaultCompanyTypes();
        }
        return config.getParsedValue();
    }

    async getInstitutions() {
        const config = await this.findByKey('institutions.list');
        
        if (!config) {
            return this.getDefaultInstitutions();
        }
        return config.getParsedValue();
    }

    async updateCountries(countries) {
        return await this.update('countries.list', {
            value: JSON.stringify(countries),
            description: 'List of available countries for user registration'
        });
    }

    async updateCompanyTypes(companyTypes) {
        return await this.update('company.types', {
            value: JSON.stringify(companyTypes),
            description: 'List of available company types for user registration'
        });
    }

    // Default fallbacks
    getDefaultCountries() {
        return [
            'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
            'France', 'Japan', 'South Korea', 'Singapore', 'Nigeria',
            'Ghana', 'South Africa', 'Kenya', 'Uganda', 'Rwanda',
            'Brazil', 'Mexico', 'India', 'China', 'United Arab Emirates'
        ];
    }

    getDefaultCompanyTypes() {
        return [
            { value: 'educational', label: 'Educational Institution' },
            { value: 'corporate', label: 'Corporate Organization' },
            { value: 'government', label: 'Government Agency' },
            { value: 'non_profit', label: 'Non-Profit Organization' },
            { value: 'recruitment', label: 'Recruitment Agency' },
            { value: 'other', label: 'Other' }
        ];
    }

    getDefaultInstitutions() {
        return {
            "totalInstitutions": 200,
            "countriesCount": 85,
            "autoVerificationCount": 120,
            "institutionTypes": [
                {
                    "type": "university",
                    "name": "Universities",
                    "icon": "fas fa-university",
                    "defaultIcon": "fas fa-graduation-cap",
                    "institutions": [
                        {
                            "id": 1,
                            "name": "Harvard University",
                            "country": "United States",
                            "region": "Massachusetts",
                            "established": 1636,
                            "students": "21,000",
                            "logo": "/images/institutions/harvard.png",
                            "verification": {
                                "type": "Auto-Verification",
                                "processingTime": "24-48 hours",
                                "badgeColor": "success",
                                "notes": "Direct API integration"
                            },
                            "features": ["Research", "Graduate Programs", "International"]
                        },
                        {
                            "id": 2,
                            "name": "University of Oxford",
                            "country": "United Kingdom",
                            "region": "Oxfordshire",
                            "established": 1096,
                            "students": "24,000",
                            "logo": "/images/institutions/oxford.png",
                            "verification": {
                                "type": "Auto-Verification",
                                "processingTime": "24-48 hours",
                                "badgeColor": "success",
                                "notes": "Verified partner"
                            },
                            "features": ["Research", "Collegiate System", "Historic"]
                        }
                    ]
                },
                {
                    "type": "college",
                    "name": "Colleges & Polytechnics",
                    "icon": "fas fa-school",
                    "defaultIcon": "fas fa-school",
                    "institutions": [
                        {
                            "id": 3,
                            "name": "Community College System",
                            "country": "United States",
                            "established": 1901,
                            "students": "2,100,000",
                            "verification": {
                                "type": "Manual Review",
                                "processingTime": "3-5 days",
                                "badgeColor": "warning"
                            },
                            "features": ["Associate Degrees", "Vocational", "Transfer Programs"]
                        }
                    ]
                }
            ]
        };
    }

}

module.exports = ConfigurationRepository;