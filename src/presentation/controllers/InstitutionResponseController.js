// src/presentation/controllers/InstitutionResponseController.js
class InstitutionResponseController {
    constructor(
        processInstitutionResponseUseCase,
        analyzeInstitutionResponseUseCase,
        institutionResponseRepository
    ) {
        this.processInstitutionResponseUseCase = processInstitutionResponseUseCase;
        this.analyzeInstitutionResponseUseCase = analyzeInstitutionResponseUseCase;
        this.institutionResponseRepository = institutionResponseRepository;
    }

    async processApiResponse(req, res) {
        try {
            const { verificationId } = req.params;
            const apiConfig = req.body.apiConfig;
            const processorId = req.user.id;

            // Get API config from institution settings
            const institutionResponse = await this.institutionResponseRepository.findByVerificationId(verificationId);
            if (!institutionResponse) {
                return res.status(404).json({ error: 'Not found' });
            }

            const result = await this.useCases.processApiResponse.execute(verificationId, apiConfig);

            res.json({
                success: true,
                data: result,
                message: 'API response processed successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async submitManualEntry(req, res) {
        try {
            const { verificationId } = req.params;
            const entryData = req.body;
            const enteredBy = req.user.id;

            const result = await this.useCases.manualEntry.execute(verificationId, entryData, enteredBy);

            res.json({
                success: true,
                data: result,
                message: 'Manual entry submitted successfully'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async getResponseDetails(req, res) {
        try {
            const { verificationId } = req.params;
            const response = await this.useCases.institutionResponseRepo.findByVerificationId(verificationId);

            if (!response) {
                return res.status(404).json({
                    success: false,
                    error: 'Response not found'
                });
            }

            res.json({
                success: true,
                data: response
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async listPendingRequests(req, res) {
        try {
            const { type } = req.query; // 'api' or 'manual'
            const status = type === 'api' ? 'pending' : 'pending';
            
            const pendingResponses = await this.useCases.institutionResponseRepo.findByStatus(status);

            res.json({
                success: true,
                data: pendingResponses,
                count: pendingResponses.length
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Process institution response (API endpoint for institutions)
    async processResponse(req, res) {
        try {
            const { verificationId } = req.params;
            const institutionId = req.institution.id; // From auth middleware
            const {
                responseData,
                requestId,
                rawResponse,
                metadata = {}
            } = req.body;

            // Validate response data
            if (!responseData || typeof responseData !== 'object') {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid response data format'
                });
            }

            const result = await this.processInstitutionResponseUseCase.execute({
                verificationId,
                institutionId,
                responseData,
                responseType: 'api_auto',
                requestId,
                rawResponse: JSON.stringify(rawResponse),
                metadata: {
                    ...metadata,
                    apiKey: req.institution.apiKey,
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                }
            });

            res.status(201).json({
                success: true,
                message: 'Response processed successfully',
                data: {
                    responseId: result.response.id,
                    verificationId,
                    verificationScore: result.verificationScore,
                    status: result.status,
                    comparisonSummary: result.comparisonResults.map(r => ({
                        field: r.field,
                        match: r.match,
                        confidence: r.confidence
                    }))
                }
            });
        } catch (error) {
            console.error('[InstitutionResponseController] Error processing response:', error);
            
            const statusCode = error.message.includes('not found') ? 404 :
                              error.message.includes('already exists') ? 409 : 400;

            res.status(statusCode).json({
                success: false,
                message: error.message || 'Failed to process response',
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }

    // Manual processing (for admin/internal use)
    async manualProcessResponse(req, res) {
        try {
            const { verificationId } = req.params;
            const userId = req.user.id;
            
            const {
                responseData,
                institutionId,
                verificationScore,
                confidenceScore,
                flags = [],
                notes
            } = req.body;

            const response = await this.institutionResponseRepository.createResponse({
                verificationId,
                institutionId,
                responseData,
                verificationScore: verificationScore || 0,
                confidenceScore: confidenceScore || 0,
                status: 'completed',
                responseType: 'manual',
                processedBy: userId,
                processedAt: new Date(),
                flags,
                metadata: {
                    processedManually: true,
                    processedByUserId: userId,
                    notes
                }
            });

            res.status(201).json({
                success: true,
                message: 'Manual response recorded successfully',
                data: response
            });
        } catch (error) {
            console.error('[InstitutionResponseController] Error manual processing:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to record manual response'
            });
        }
    }

    // Get response details
    async getResponse(req, res) {
        try {
            const { verificationId } = req.params;
            const userRole = req.user.role;
            const institutionId = req.institution?.id;

            const response = await this.institutionResponseRepository
                .findByVerificationId(verificationId, true);

            if (!response) {
                return res.status(404).json({
                    success: false,
                    message: 'Response not found'
                });
            }

            // Authorization check
            if (userRole !== 'admin' && institutionId !== response.institutionId) {
                return res.status(403).json({
                    success: false,
                    message: 'Unauthorized to view this response'
                });
            }

            res.json({
                success: true,
                data: this._formatResponseForDisplay(response)
            });
        } catch (error) {
            console.error('[InstitutionResponseController] Error getting response:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve response'
            });
        }
    }

    // Analyze response
    async analyzeResponse(req, res) {
        try {
            const { verificationId } = req.params;
            const { deep = false } = req.query;

            const result = await this.analyzeInstitutionResponseUseCase.execute({
                verificationId,
                analyzeDeep: deep === 'true'
            });

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('[InstitutionResponseController] Error analyzing response:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to analyze response'
            });
        }
    }

    // Get response statistics
    async getStatistics(req, res) {
        try {
            const institutionId = req.institution?.id;
            const { timeframe = '30d' } = req.query;

            const stats = await this.institutionResponseRepository.getResponseStats(
                institutionId,
                timeframe
            );

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('[InstitutionResponseController] Error getting statistics:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve statistics'
            });
        }
    }

    // Search responses
    async searchResponses(req, res) {
        try {
            const {
                status,
                minScore,
                maxScore,
                startDate,
                endDate,
                hasFlags,
                responseType,
                page = 1,
                limit = 50
            } = req.query;

            const searchCriteria = {
                institutionId: req.institution?.id,
                status,
                minScore: minScore ? parseInt(minScore) : undefined,
                maxScore: maxScore ? parseInt(maxScore) : undefined,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                hasFlags: hasFlags === 'true',
                responseType,
                limit: parseInt(limit),
                offset: (parseInt(page) - 1) * parseInt(limit)
            };

            const { rows: responses, count: total } = await this.institutionResponseRepository
                .searchResponses(searchCriteria);

            res.json({
                success: true,
                data: responses.map(r => this._formatResponseForDisplay(r)),
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            });
        } catch (error) {
            console.error('[InstitutionResponseController] Error searching responses:', error);
            res.status(400).json({
                success: false,
                message: 'Failed to search responses'
            });
        }
    }

    // Add flag to response
    async addFlag(req, res) {
        try {
            const { verificationId } = req.params;
            const { flag, description, severity = 'medium' } = req.body;
            const userId = req.user.id;

            if (!flag || !description) {
                return res.status(400).json({
                    success: false,
                    message: 'Flag and description are required'
                });
            }

            const response = await this.institutionResponseRepository.addFlag(verificationId, {
                flag,
                description,
                severity,
                addedBy: userId,
                addedAt: new Date()
            });

            res.json({
                success: true,
                message: 'Flag added successfully',
                data: response
            });
        } catch (error) {
            console.error('[InstitutionResponseController] Error adding flag:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to add flag'
            });
        }
    }

    // Update response status
    async updateStatus(req, res) {
        try {
            const { verificationId } = req.params;
            const { status, notes } = req.body;
            const userId = req.user.id;

            const validStatuses = ['completed', 'requires_review', 'discrepancy', 'failed'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
                });
            }

            const response = await this.institutionResponseRepository.updateStatus(
                verificationId,
                status,
                {
                    processedBy: userId,
                    metadata: { statusChangeNotes: notes }
                }
            );

            res.json({
                success: true,
                message: `Status updated to ${status}`,
                data: response
            });
        } catch (error) {
            console.error('[InstitutionResponseController] Error updating status:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to update status'
            });
        }
    }

    // Export responses
    async exportResponses(req, res) {
        try {
            const { format = 'json', startDate, endDate } = req.query;
            const institutionId = req.institution?.id;

            const where = { institutionId };
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate) where.createdAt.$gte = new Date(startDate);
                if (endDate) where.createdAt.$lte = new Date(endDate);
            }

            const responses = await this.institutionResponseRepository.findAll({
                where,
                include: [
                    { association: 'verification' },
                    { association: 'institution' }
                ],
                limit: 1000 // Export limit
            });

            if (format === 'csv') {
                const csv = this._convertToCSV(responses);
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', 'attachment; filename=responses.csv');
                return res.send(csv);
            }

            // Default JSON export
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename=responses.json');
            res.send(JSON.stringify(responses, null, 2));
        } catch (error) {
            console.error('[InstitutionResponseController] Error exporting responses:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to export responses'
            });
        }
    }

    // Private helper methods
    _formatResponseForDisplay(response) {
        const formatted = {
            id: response.id,
            verificationId: response.verificationId,
            institutionId: response.institutionId,
            requestId: response.requestId,
            verificationScore: response.verificationScore,
            status: response.status,
            responseType: response.responseType,
            processedAt: response.processedAt,
            confidenceScore: response.confidenceScore,
            flags: response.flags,
            metadata: response.metadata,
            createdAt: response.createdAt,
            updatedAt: response.updatedAt
        };

        // Include related data if available
        if (response.verification) {
            formatted.verification = {
                id: response.verification.id,
                referenceNumber: response.verification.referenceNumber,
                studentName: `${response.verification.firstName} ${response.verification.lastName}`,
                studentId: response.verification.studentId
            };
        }

        if (response.institution) {
            formatted.institution = {
                id: response.institution.id,
                name: response.institution.name,
                code: response.institution.code
            };
        }

        if (response.processor) {
            formatted.processor = {
                id: response.processor.id,
                name: response.processor.name,
                email: response.processor.email
            };
        }

        // Include response data (sensitive info might be filtered based on role)
        if (req.user.role === 'admin' || req.institution?.id === response.institutionId) {
            formatted.responseData = response.responseData;
            formatted.rawResponse = response.rawResponse;
        } else {
            // Return only key fields for non-admin users
            formatted.responseData = {
                studentName: response.responseData?.studentName,
                studentId: response.responseData?.studentId,
                courseName: response.responseData?.courseName,
                graduationYear: response.responseData?.graduationYear
            };
        }

        return formatted;
    }

    _convertToCSV(responses) {
        const headers = [
            'Response ID',
            'Verification ID',
            'Institution',
            'Student Name',
            'Student ID',
            'Verification Score',
            'Status',
            'Response Type',
            'Processed At',
            'Flags Count'
        ];

        const rows = responses.map(response => [
            response.id,
            response.verificationId,
            response.institution?.name || 'N/A',
            response.responseData?.studentName || 'N/A',
            response.responseData?.studentId || 'N/A',
            response.verificationScore,
            response.status,
            response.responseType,
            response.processedAt?.toISOString() || 'N/A',
            response.flags?.length || 0
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        return csvContent;
    }
}

module.exports = InstitutionResponseController;