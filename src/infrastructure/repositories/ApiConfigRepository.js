const ApiInstitutionConfig = require('../../domain/entities/system/ApiInstitutionConfig');
const ApiConfig = require('../database/models/ApiInstitutionConfig');

class ApiConfigRepository {
    async findByInstitutionId(institutionId) {
        const config = await ApiConfig.findOne({
            where: { institutionId, isActive: true }
        });
        return config ? new ApiInstitutionConfig(config.toJSON()) : null;
    }

    async testConnection(config) {
        // Test API connection
        const testConfig = new ApiInstitutionConfig(config);
        const axios = require('axios');
        
        try {
            const response = await axios({
                method: 'GET',
                url: testConfig.apiEndpoint,
                headers: testConfig.getAuthHeaders(),
                timeout: 5000
            });
            return { success: true, status: response.status };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = ApiConfigRepository;