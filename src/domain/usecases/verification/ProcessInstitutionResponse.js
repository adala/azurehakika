// src/domain/usecases/institution/ProcessInstitutionResponseUseCase.js
const InstitutionResponse = require('../../entities/InstitutionResponse');
class ProcessInstitutionResponse {
    constructor(institutionResponseRepository, verificationRepository, notificationService) {
        this.institutionResponseRepository = institutionResponseRepository;
        this.verificationRepository = verificationRepository;
        this.notificationService = notificationService;
    }

    async execute({
        verificationId,
        institutionId,
        responseData,
        responseType = 'api_auto',
        requestId = null,
        rawResponse = null,
        processedBy = null,
        metadata = {}
    }) {
        try {
            // 1. Validate verification exists and belongs to institution
            const verification = await this.verificationRepository.findById(verificationId);
            if (!verification) {
                throw new Error('Verification not found');
            }

            if (verification.institutionId !== institutionId) {
                throw new Error('Verification does not belong to this institution');
            }

            // 2. Check if response already exists
            const existingResponse = await this.institutionResponseRepository
                .findByVerificationId(verificationId);
            
            if (existingResponse) {
                throw new Error('Response already exists for this verification');
            }

            // 3. Create domain entity
            const responseEntity = InstitutionResponse.createFromInstitutionData(
                verificationId,
                institutionId,
                responseData,
                responseType
            );

            // 4. Calculate verification score
            const submittedData = this._extractSubmittedData(verification);
            responseEntity.calculateVerificationScore(submittedData);

            // 5. Determine status based on score
            const status = this._determineStatus(responseEntity.verificationScore);
            responseEntity.status = status;

            // 6. Add metadata
            responseEntity.metadata = {
                ...metadata,
                processedBy,
                requestId,
                verificationMethod: this._detectVerificationMethod(responseData)
            };

            // 7. Save to repository
            const savedResponse = await this.institutionResponseRepository.createResponse({
                verificationId: responseEntity.verificationId,
                institutionId: responseEntity.institutionId,
                requestId: responseEntity.requestId,
                responseData: responseEntity.responseData,
                verificationScore: responseEntity.verificationScore,
                status: responseEntity.status,
                responseType: responseEntity.responseType,
                processedBy: responseEntity.processedBy,
                processedAt: responseEntity.processedAt,
                rawResponse: responseEntity.rawResponse,
                confidenceScore: responseEntity.confidenceScore,
                flags: responseEntity.flags,
                metadata: responseEntity.metadata
            });

            // 8. Update verification status
            await this.verificationRepository.update(verificationId, {
                institutionResponse: responseEntity.responseData,
                verificationScore: responseEntity.verificationScore,
                status: 'completed',
                completedAt: new Date()
            });

            // 9. Send notifications
            await this._sendNotifications(verification, responseEntity);

            // 10. Log the processing
            console.log(`[ProcessInstitutionResponse] Response saved for verification ${verificationId}`);

            return {
                success: true,
                response: savedResponse,
                comparisonResults: responseEntity.getComparisonResults(submittedData),
                verificationScore: responseEntity.verificationScore,
                status: responseEntity.status
            };
        } catch (error) {
            console.error('[ProcessInstitutionResponseUseCase] Error:', error);
            throw error;
        }
    }

    _extractSubmittedData(verification) {
        return {
            studentName: `${verification.firstName} ${verification.lastName}`,
            studentId: verification.studentId,
            courseName: verification.courseName,
            degreeType: verification.degreeType,
            graduationYear: verification.graduationYear,
            classification: verification.classification,
            dateOfBirth: verification.dateOfBirth,
            fieldOfStudy: verification.fieldOfStudy
        };
    }

    _determineStatus(score) {
        if (score >= 90) return 'completed';
        if (score >= 70) return 'requires_review';
        if (score >= 50) return 'discrepancy';
        return 'failed';
    }

    _detectVerificationMethod(responseData) {
        // Analyze response data to determine verification method
        if (responseData.apiVersion) return 'api_automated';
        if (responseData.verifiedBy) return 'manual_review';
        if (responseData.databaseMatch) return 'database_lookup';
        return 'unknown';
    }

    async _sendNotifications(verification, response) {
        try {
            // Notify user
            await this.notificationService.send({
                type: 'verification_completed',
                userId: verification.userId,
                data: {
                    verificationId: verification.id,
                    referenceNumber: verification.referenceNumber,
                    verificationScore: response.verificationScore,
                    status: response.status
                }
            });

            // Notify admin if score is low
            if (response.verificationScore < 70) {
                await this.notificationService.send({
                    type: 'verification_requires_review',
                    role: 'admin',
                    data: {
                        verificationId: verification.id,
                        verificationScore: response.verificationScore,
                        flags: response.flags
                    }
                });
            }
        } catch (error) {
            console.error('[ProcessInstitutionResponseUseCase] Notification error:', error);
        }
    }
}

module.exports = ProcessInstitutionResponse;