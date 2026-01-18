// src/domain/usecases/institution/AnalyzeInstitutionResponseUseCase.js
class AnalyzeInstitutionResponseUseCase {
    constructor(institutionResponseRepository) {
        this.institutionResponseRepository = institutionResponseRepository;
    }

    async execute({ verificationId, analyzeDeep = false }) {
        try {
            // 1. Get response with related data
            const response = await this.institutionResponseRepository
                .findByVerificationId(verificationId, true);
            
            if (!response) {
                throw new Error('Institution response not found');
            }

            // 2. Create domain entity
            const responseEntity = new InstitutionResponse({
                id: response.id,
                verificationId: response.verificationId,
                institutionId: response.institutionId,
                responseData: response.responseData,
                verificationScore: response.verificationScore,
                status: response.status,
                responseType: response.responseType,
                rawResponse: response.rawResponse,
                confidenceScore: response.confidenceScore,
                flags: response.flags,
                metadata: response.metadata
            });

            // 3. Extract verification data for comparison
            const verification = response.verification;
            const submittedData = {
                studentName: `${verification.firstName} ${verification.lastName}`,
                studentId: verification.studentId,
                courseName: verification.courseName,
                degreeType: verification.degreeType,
                graduationYear: verification.graduationYear,
                classification: verification.classification,
                dateOfBirth: verification.dateOfBirth,
                fieldOfStudy: verification.fieldOfStudy
            };

            // 4. Perform analysis
            const analysis = {
                basic: this._performBasicAnalysis(responseEntity, submittedData),
                flags: this._analyzeFlags(responseEntity),
                dataQuality: this._assessDataQuality(responseEntity),
                riskAssessment: this._assessRisk(responseEntity),
                recommendations: []
            };

            // 5. Deep analysis if requested
            if (analyzeDeep) {
                analysis.deep = {
                    patternAnalysis: this._analyzePatterns(responseEntity),
                    anomalyDetection: this._detectAnomalies(responseEntity, submittedData),
                    confidenceAnalysis: this._analyzeConfidence(responseEntity)
                };
            }

            // 6. Generate recommendations
            analysis.recommendations = this._generateRecommendations(analysis);

            return {
                success: true,
                verificationId,
                analysis,
                summary: responseEntity.getSummary()
            };
        } catch (error) {
            console.error('[AnalyzeInstitutionResponseUseCase] Error:', error);
            throw error;
        }
    }

    _performBasicAnalysis(responseEntity, submittedData) {
        const comparisonResults = responseEntity.getComparisonResults(submittedData);
        
        return {
            matchCount: comparisonResults.filter(r => r.match).length,
            totalFields: comparisonResults.length,
            matchPercentage: Math.round(
                (comparisonResults.filter(r => r.match).length / comparisonResults.length) * 100
            ),
            avgConfidence: Math.round(
                comparisonResults.reduce((sum, r) => sum + r.confidence, 0) / comparisonResults.length
            ),
            fieldAnalysis: comparisonResults.map(result => ({
                field: result.field,
                status: result.match ? 'match' : 'mismatch',
                confidence: result.confidence,
                severity: result.confidence < 70 ? 'high' : result.confidence < 90 ? 'medium' : 'low'
            }))
        };
    }

    _analyzeFlags(responseEntity) {
        const flags = responseEntity.flags;
        
        return {
            total: flags.length,
            bySeverity: {
                high: flags.filter(f => f.severity === 'high').length,
                medium: flags.filter(f => f.severity === 'medium').length,
                low: flags.filter(f => f.severity === 'low').length
            },
            commonIssues: this._identifyCommonIssues(flags),
            requiresAttention: flags.some(f => f.severity === 'high')
        };
    }

    _assessDataQuality(responseEntity) {
        const responseData = responseEntity.responseData;
        const fields = ['studentName', 'studentId', 'courseName', 'degreeType', 'graduationYear'];
        
        let completeness = 0;
        let consistency = 0;
        
        fields.forEach(field => {
            if (responseData[field]) {
                completeness++;
                
                // Check data consistency
                if (this._isConsistentData(field, responseData[field])) {
                    consistency++;
                }
            }
        });

        const completenessScore = Math.round((completeness / fields.length) * 100);
        const consistencyScore = Math.round((consistency / completeness) * 100) || 0;

        return {
            completenessScore,
            consistencyScore,
            overallQuality: Math.round((completenessScore + consistencyScore) / 2),
            missingFields: fields.filter(f => !responseData[f]),
            inconsistentFields: fields.filter(f => 
                responseData[f] && !this._isConsistentData(f, responseData[f])
            )
        };
    }

    _assessRisk(responseEntity) {
        let riskScore = 0;
        const factors = [];

        // Low verification score
        if (responseEntity.verificationScore < 70) {
            riskScore += 30;
            factors.push('Low verification score');
        }

        // High severity flags
        if (responseEntity.getHighSeverityFlags().length > 0) {
            riskScore += 40;
            factors.push('High severity flags present');
        }

        // Data quality issues
        const quality = this._assessDataQuality(responseEntity);
        if (quality.overallQuality < 70) {
            riskScore += 20;
            factors.push('Poor data quality');
        }

        // Response time too fast (potential fraud)
        if (responseEntity.metadata.responseTime && responseEntity.metadata.responseTime < 1000) {
            riskScore += 10;
            factors.push('Suspiciously fast response time');
        }

        return {
            riskScore: Math.min(riskScore, 100),
            level: riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low',
            factors,
            recommendations: this._getRiskMitigations(riskScore)
        };
    }

    _analyzePatterns(responseEntity) {
        const patterns = {
            responsePattern: this._identifyResponsePattern(responseEntity.responseData),
            institutionPattern: this._identifyInstitutionPattern(responseEntity.metadata),
            temporalPattern: this._analyzeTemporalPattern(responseEntity)
        };

        return patterns;
    }

    _detectAnomalies(responseEntity, submittedData) {
        const anomalies = [];

        // Check for data inconsistencies
        const comparison = responseEntity.getComparisonResults(submittedData);
        
        comparison.forEach(result => {
            if (result.confidence < 50 && result.submitted !== 'Not provided') {
                anomalies.push({
                    type: 'data_mismatch',
                    field: result.field,
                    severity: 'high',
                    description: `Significant mismatch in ${result.field} (${result.confidence}% confidence)`
                });
            }
        });

        // Check response metadata anomalies
        if (responseEntity.metadata.responseTime && responseEntity.metadata.responseTime < 500) {
            anomalies.push({
                type: 'response_time',
                severity: 'medium',
                description: 'Response time unusually fast'
            });
        }

        // Check for suspicious patterns in raw response
        if (responseEntity.rawResponse && 
            responseEntity.rawResponse.includes('template') || 
            responseEntity.rawResponse.includes('placeholder')) {
            anomalies.push({
                type: 'template_response',
                severity: 'high',
                description: 'Response appears to be a template or placeholder'
            });
        }

        return anomalies;
    }

    _analyzeConfidence(responseEntity) {
        const internalConfidence = responseEntity.confidenceScore;
        const calculatedConfidence = Math.round(
            responseEntity.verificationScore * 0.7 + 
            (this._assessDataQuality(responseEntity).overallQuality * 0.3)
        );

        const confidenceGap = Math.abs(internalConfidence - calculatedConfidence);

        return {
            internalConfidence,
            calculatedConfidence,
            confidenceGap,
            isConsistent: confidenceGap < 20,
            confidenceFactors: this._identifyConfidenceFactors(responseEntity)
        };
    }

    _generateRecommendations(analysis) {
        const recommendations = [];

        if (analysis.basic.matchPercentage < 90) {
            recommendations.push('Consider manual review of data discrepancies');
        }

        if (analysis.flags.requiresAttention) {
            recommendations.push('Address high severity flags before finalizing verification');
        }

        if (analysis.dataQuality.overallQuality < 80) {
            recommendations.push('Request additional information from institution');
        }

        if (analysis.riskAssessment.level === 'high') {
            recommendations.push('Flag for thorough investigation');
            recommendations.push('Consider additional verification steps');
        }

        if (analysis.riskAssessment.level === 'medium') {
            recommendations.push('Review with quality assurance team');
        }

        return recommendations;
    }

    // Helper methods
    _isConsistentData(field, value) {
        // Check if data appears consistent
        switch (field) {
            case 'graduationYear':
                const year = parseInt(value);
                return !isNaN(year) && year >= 1900 && year <= new Date().getFullYear() + 5;
            case 'studentId':
                return value.length >= 3 && value.length <= 20;
            case 'studentName':
                return value.split(' ').length >= 2;
            default:
                return value && value.trim().length > 0;
        }
    }

    _identifyCommonIssues(flags) {
        const issueCount = {};
        flags.forEach(flag => {
            issueCount[flag.flag] = (issueCount[flag.flag] || 0) + 1;
        });

        return Object.entries(issueCount)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([issue, count]) => ({ issue, count }));
    }

    _getRiskMitigations(riskScore) {
        if (riskScore >= 70) {
            return [
                'Require additional documentation',
                'Perform secondary verification',
                'Flag for manual review'
            ];
        } else if (riskScore >= 40) {
            return [
                'Request clarification from institution',
                'Verify with alternative data sources'
            ];
        }
        return ['Standard verification procedures acceptable'];
    }

    _identifyResponsePattern(data) {
        const patterns = [];
        
        // Check for standardized responses
        if (Object.keys(data).length <= 3) {
            patterns.push('minimal_response');
        }
        
        if (data.studentName && data.studentName.includes(',')) {
            patterns.push('name_format_standardized');
        }

        return patterns;
    }

    _identifyInstitutionPattern(metadata) {
        const patterns = [];
        
        if (metadata.apiVersion) {
            patterns.push('api_integration');
        }
        
        if (metadata.verificationMethod === 'manual_review') {
            patterns.push('manual_processing');
        }

        return patterns;
    }

    _analyzeTemporalPattern(responseEntity) {
        const patterns = [];
        const createdAt = new Date(responseEntity.metadata.createdAt || responseEntity.createdAt);
        const processedAt = new Date(responseEntity.metadata.processedAt || responseEntity.processedAt);
        
        const processingTime = processedAt - createdAt;
        
        if (processingTime < 60000) { // Less than 1 minute
            patterns.push('instant_processing');
        } else if (processingTime < 3600000) { // Less than 1 hour
            patterns.push('fast_processing');
        } else {
            patterns.push('normal_processing');
        }

        return {
            processingTime,
            patterns,
            isBusinessHours: this._isBusinessHours(createdAt)
        };
    }

    _isBusinessHours(date) {
        const hour = date.getHours();
        const day = date.getDay();
        return day >= 1 && day <= 5 && hour >= 9 && hour <= 17;
    }

    _identifyConfidenceFactors(responseEntity) {
        const factors = [];
        
        if (responseEntity.verificationScore >= 90) {
            factors.push('high_verification_score');
        }
        
        if (responseEntity.flags.length === 0) {
            factors.push('no_flags');
        }
        
        if (responseEntity.metadata.verificationMethod === 'database_lookup') {
            factors.push('database_verified');
        }

        return factors;
    }
}

module.exports = AnalyzeInstitutionResponseUseCase;