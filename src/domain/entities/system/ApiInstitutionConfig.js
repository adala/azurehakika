class ApiInstitutionConfig {
    constructor({
        id,
        institutionId,
        apiEndpoint,
        apiKey,
        apiSecret,
        authMethod = 'api_key',
        requestFormat = 'json',
        responseFormat = 'json',
        timeout = 30000,
        retryAttempts = 3,
        headers = {},
        requestTemplate = {},
        validationRules = {},
        isActive = true
    }) {
        this.id = id;
        this.institutionId = institutionId;
        this.apiEndpoint = apiEndpoint;
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
        this.authMethod = authMethod;
        this.requestFormat = requestFormat;
        this.responseFormat = responseFormat;
        this.timeout = timeout;
        this.retryAttempts = retryAttempts;
        this.headers = headers;
        this.requestTemplate = requestTemplate;
        this.validationRules = validationRules;
        this.isActive = isActive;
    }

    getAuthHeaders() {
        switch(this.authMethod) {
            case 'api_key':
                return { 
                    'X-API-Key': this.apiKey,
                    ...this.headers 
                };
            case 'bearer':
                return { 
                    'Authorization': `Bearer ${this.apiKey}`,
                    ...this.headers 
                };
            case 'basic':
                const authString = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64');
                return { 
                    'Authorization': `Basic ${authString}`,
                    ...this.headers 
                };
            default:
                return this.headers;
        }
    }

    buildRequestPayload(verificationData) {
        const payload = { ...this.requestTemplate };
        
        // Map verification data to API request format
        payload.studentId = verificationData.studentId;
        payload.firstName = verificationData.firstName;
        payload.lastName = verificationData.lastName;
        payload.dateOfBirth = verificationData.dateOfBirth;
        payload.courseName = verificationData.courseName;
        payload.degreeType = verificationData.degreeType;
        payload.graduationYear = verificationData.graduationYear;
        
        return payload;
    }
}

module.exports = ApiInstitutionConfig;