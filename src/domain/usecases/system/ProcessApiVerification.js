
class ProcessApiVerification {
    constructor(
        assignmentRepository,
        verificationRepository,
        institutionResponseRepository,
        apiConfigRepository,
        apiClient,
        responseParser
    ) {
        this.assignmentRepository = assignmentRepository;
        this.verificationRepository = verificationRepository;
        this.institutionResponseRepository = institutionResponseRepository;
        this.apiConfigRepository = apiConfigRepository;
        this.apiClient = apiClient;
        this.responseParser = responseParser;
    }

    async execute(assignmentId, assigneeId) {
        // 1. Validate assignment
        const assignment = await this.assignmentRepository.findById(assignmentId);
        if (!assignment || assignment.assigneeId !== assigneeId) {
            throw new Error('Assignment not found or unauthorized');
        }

        if (!assignment.canBeProcessedBy(assigneeId)) {
            throw new Error('Assignment cannot be processed');
        }

        // 2. Update assignment status
        await this.assignmentRepository.updateStatus(assignmentId, 'processing');

        // 3. Get verification and institution data
        const verification = await this.verificationRepository.findById(assignment.verificationId);
        const apiConfig = await this.apiConfigRepository.findByInstitutionId(assignment.institutionId);

        if (!apiConfig) {
            await this.assignmentRepository.updateStatus(assignmentId, 'pending');
            throw new Error('API configuration not found for institution');
        }

        try {
            // 4. Call institution API
            const apiResult = await this.apiClient.callWithRetry(apiConfig, verification);

            if (!apiResult.success) {
                throw new Error(`API call failed: ${apiResult.error}`);
            }

            // 5. Parse and validate response
            const parsedResponse = this.responseParser.parseApiResponse(apiResult.data, verification);

            // 6. Create or update institution response
            let institutionResponse = await this.institutionResponseRepository.findByVerificationId(verification.id);

            if (!institutionResponse) {
                institutionResponse = await this.institutionResponseRepository.create({
                    verificationId: verification.id,
                    institutionId: assignment.institutionId,
                    requestId: `API-${Date.now()}`,
                    responseData: parsedResponse.data,
                    verificationScore: parsedResponse.scores.verificationScore,
                    status: parsedResponse.isComplete ? 'completed' : 'requires_review',
                    responseType: 'api_auto',
                    processedBy: assigneeId,
                    processedAt: new Date(),
                    rawResponse: JSON.stringify(apiResult.rawResponse),
                    confidenceScore: parsedResponse.scores.confidenceScore,
                    flags: parsedResponse.flags,
                    metadata: {
                        apiEndpoint: apiConfig.apiEndpoint,
                        responseTime: apiResult.responseTime,
                        statusCode: apiResult.statusCode,
                        apiVersion: '1.0',
                        dataSource: 'institution_api'
                    },
                    responseTime: apiResult.responseTime,
                    apiVersion: '1.0',
                    dataSource: 'institution_api',
                    verificationDate: new Date(),
                    isVerified: parsedResponse.data.studentVerified || false,
                    verificationMethod: 'api_lookup',
                    dataQualityScore: parsedResponse.scores.dataQualityScore,
                    completenessScore: parsedResponse.scores.completenessScore,
                    timelinessScore: parsedResponse.scores.timelinessScore
                });
            } else {
                institutionResponse = await this.institutionResponseRepository.update(institutionResponse.id, {
                    responseData: parsedResponse.data,
                    verificationScore: parsedResponse.scores.verificationScore,
                    status: parsedResponse.isComplete ? 'completed' : 'requires_review',
                    responseType: 'api_auto',
                    processedBy: assigneeId,
                    processedAt: new Date(),
                    rawResponse: JSON.stringify(apiResult.rawResponse),
                    confidenceScore: parsedResponse.scores.confidenceScore,
                    flags: parsedResponse.flags,
                    metadata: {
                        ...institutionResponse.metadata,
                        apiEndpoint: apiConfig.apiEndpoint,
                        responseTime: apiResult.responseTime,
                        statusCode: apiResult.statusCode
                    },
                    responseTime: apiResult.responseTime,
                    isVerified: parsedResponse.data.studentVerified || false
                });
            }

            // 7. Update assignment status
            await this.assignmentRepository.updateStatus(assignmentId, 'completed');

            // 8. Update verification status
            await this.verificationRepository.updateStatus(verification.id,
                parsedResponse.isComplete ? 'completed' : 'processing'
            );

            return {
                success: true,
                institutionResponse,
                scores: parsedResponse.scores,
                flags: parsedResponse.flags
            };

        } catch (error) {
            // Update assignment as failed
            await this.assignmentRepository.updateStatus(assignmentId, 'failed');

            // Create failed response record
            await this.institutionResponseRepository.create({
                verificationId: verification.id,
                institutionId: assignment.institutionId,
                requestId: `API-${Date.now()}`,
                responseData: {},
                verificationScore: 0,
                status: 'failed',
                responseType: 'api_auto',
                processedBy: assigneeId,
                processedAt: new Date(),
                rawResponse: JSON.stringify({ error: error.message }),
                confidenceScore: 0,
                flags: ['api_error'],
                metadata: {
                    apiEndpoint: apiConfig.apiEndpoint,
                    error: error.message,
                    failedAt: new Date()
                },
                notes: `API processing failed: ${error.message}`
            });

            throw error;
        }
    }
}

module.exports = ProcessApiVerification;