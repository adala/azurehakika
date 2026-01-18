class BulkVerification {
    constructor({
        id,
        userId,
        name,
        totalRecords,
        processedRecords,
        successfulVerifications,
        failedVerifications,
        status,
        filePath,
        results,
        createdAt,
        updatedAt
    }) {
        this.id = id;
        this.userId = userId;
        this.name = name;
        this.totalRecords = totalRecords || 0;
        this.processedRecords = processedRecords || 0;
        this.successfulVerifications = successfulVerifications || 0;
        this.failedVerifications = failedVerifications || 0;
        this.status = status || 'pending';
        this.filePath = filePath;
        this.results = results || [];
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    getProgress() {
        if (this.totalRecords === 0) return 0;
        return (this.processedRecords / this.totalRecords) * 100;
    }

    getSuccessRate() {
        if (this.processedRecords === 0) return 0;
        return (this.successfulVerifications / this.processedRecords) * 100;
    }

    validate() {
        const errors = [];

        if (!this.name || this.name.length < 2) {
            errors.push('Bulk verification name is required');
        }

        if (!this.filePath) {
            errors.push('File path is required');
        }

        return errors;
    }

    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            name: this.name,
            totalRecords: this.totalRecords,
            processedRecords: this.processedRecords,
            successfulVerifications: this.successfulVerifications,
            failedVerifications: this.failedVerifications,
            status: this.status,
            progress: this.getProgress(),
            successRate: this.getSuccessRate(),
            filePath: this.filePath,
            results: this.results,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

module.exports = BulkVerification;