class InstitutionResponse {
    constructor({
        id,
        verificationId,
        institutionId,
        requestId,
        responseData,
        verificationScore,
        status = 'pending',
        responseType = 'manual',
        processedBy,
        processedAt,
        rawResponse,
        confidenceScore = 0,
        flags = [],
        metadata = {},
        responseTime,
        apiVersion,
        dataSource,
        verificationDate,
        expiryDate,
        cost,
        currency = 'USD',
        notes,
        attachments = [],
        isVerified = false,
        verificationMethod,
        dataQualityScore,
        completenessScore,
        timelinessScore
    }) {
        this.id = id;
        this.verificationId = verificationId;
        this.institutionId = institutionId;
        this.requestId = requestId;
        this.responseData = responseData;
        this.verificationScore = verificationScore;
        this.status = status;
        this.responseType = responseType;
        this.processedBy = processedBy;
        this.processedAt = processedAt;
        this.rawResponse = rawResponse;
        this.confidenceScore = confidenceScore;
        this.flags = flags;
        this.metadata = metadata;
        this.responseTime = responseTime;
        this.apiVersion = apiVersion;
        this.dataSource = dataSource;
        this.verificationDate = verificationDate;
        this.expiryDate = expiryDate;
        this.cost = cost;
        this.currency = currency;
        this.notes = notes;
        this.attachments = attachments;
        this.isVerified = isVerified;
        this.verificationMethod = verificationMethod;
        this.dataQualityScore = dataQualityScore;
        this.completenessScore = completenessScore;
        this.timelinessScore = timelinessScore;
    }

    // Business rules
    canProcess() {
        return this.status === 'pending' || this.status === 'requires_review';
    }

    markAsVerified(score, method, processedBy) {
        this.verificationScore = score;
        this.isVerified = score >= 80; // Business rule: 80% threshold
        this.verificationMethod = method;
        this.processedBy = processedBy;
        this.processedAt = new Date();
        this.status = 'completed';
    }

    hasDiscrepancy() {
        return this.flags.length > 0 || this.verificationScore < 70;
    }
}

module.exports = InstitutionResponse;