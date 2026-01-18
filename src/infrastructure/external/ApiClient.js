const axios = require('axios');
const { EventEmitter } = require('events');

class ApiClient extends EventEmitter {
    constructor() {
        super();
        this.axiosInstance = axios.create({
            timeout: 30000,
            validateStatus: function (status) {
                return status >= 200 && status < 500;
            }
        });
    }

    async callInstitutionApi(apiConfig, verificationData) {
        const startTime = Date.now();
        
        try {
            this.emit('apiCallStarted', { 
                institutionId: apiConfig.institutionId,
                verificationId: verificationData.id 
            });

            const requestPayload = apiConfig.buildRequestPayload(verificationData);
            
            const response = await this.axiosInstance({
                method: 'POST',
                url: apiConfig.apiEndpoint,
                headers: apiConfig.getAuthHeaders(),
                data: requestPayload,
                timeout: apiConfig.timeout
            });

            const responseTime = Date.now() - startTime;

            this.emit('apiCallCompleted', {
                institutionId: apiConfig.institutionId,
                verificationId: verificationData.id,
                responseTime,
                statusCode: response.status
            });

            return {
                success: true,
                data: this.parseResponse(response.data, apiConfig.responseFormat),
                rawResponse: response.data,
                statusCode: response.status,
                responseTime,
                headers: response.headers
            };
        } catch (error) {
            const responseTime = Date.now() - startTime;
            
            this.emit('apiCallFailed', {
                institutionId: apiConfig.institutionId,
                verificationId: verificationData.id,
                error: error.message,
                responseTime
            });

            return {
                success: false,
                error: error.message,
                responseTime,
                statusCode: error.response?.status || 0
            };
        }
    }

    parseResponse(data, format) {
        switch(format) {
            case 'json':
                return typeof data === 'string' ? JSON.parse(data) : data;
            case 'xml':
                return this.parseXml(data);
            default:
                return data;
        }
    }

    parseXml(xmlString) {
        // Implement XML parsing logic
        // For now, return as text
        return { raw: xmlString };
    }

    async callWithRetry(apiConfig, verificationData, maxRetries = 3) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const result = await this.callInstitutionApi(apiConfig, verificationData);
                if (result.success) {
                    return result;
                }
                lastError = result.error;
                
                if (attempt < maxRetries) {
                    await this.delay(Math.pow(2, attempt) * 1000); // Exponential backoff
                }
            } catch (error) {
                lastError = error.message;
                if (attempt < maxRetries) {
                    await this.delay(Math.pow(2, attempt) * 1000);
                }
            }
        }
        
        throw new Error(`API call failed after ${maxRetries} attempts: ${lastError}`);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = ApiClient;