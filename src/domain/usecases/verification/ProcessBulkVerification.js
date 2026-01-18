class ProcessBulkVerification {
    constructor(
        bulkVerificationRepository,
        verificationRepository,
        institutionRepository,
        walletRepository,
        fileService,
        aiAgentService
    ) {
        this.bulkVerificationRepository = bulkVerificationRepository;
        this.verificationRepository = verificationRepository;
        this.institutionRepository = institutionRepository;
        this.walletRepository = walletRepository;
        this.fileService = fileService;
        this.aiAgentService = aiAgentService;
    }

    async execute(userId, bulkVerificationData, file) {
        // Validate user has sufficient balance for all verifications
        const wallet = await this.walletRepository.findByUserId(userId);
        const totalCost = bulkVerificationData.records.length * 10; // Assuming $10 per verification

        if (!wallet.canAfford(totalCost)) {
            throw new Error(`Insufficient balance. Required: $${totalCost}, Available: $${wallet.balance}`);
        }

        // Upload bulk file
        const filePath = await this.fileService.uploadBulkFile(file);

        const bulkVerification = new BulkVerification({
            userId,
            name: bulkVerificationData.name,
            totalRecords: bulkVerificationData.records.length,
            filePath,
            status: 'processing'
        });

        const validationErrors = bulkVerification.validate();
        if (validationErrors.length > 0) {
            throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
        }

        // Create bulk verification record
        const createdBulk = await this.bulkVerificationRepository.create(bulkVerification);

        // Process in background (in production, use job queue)
        this.processBulkInBackground(createdBulk.id, bulkVerificationData.records);

        return createdBulk.toJSON();
    }

    async processBulkInBackground(bulkId, records) {
        try {
            for (let i = 0; i < records.length; i++) {
                const record = records[i];

                // Process individual verification
                await this.processSingleVerification(bulkId, record, i);

                // Update progress
                await this.bulkVerificationRepository.updateProgress(bulkId, i + 1);
            }

            // Mark as completed
            await this.bulkVerificationRepository.updateStatus(bulkId, 'completed');
        } catch (error) {
            await this.bulkVerificationRepository.updateStatus(bulkId, 'failed');
            console.error('Bulk processing failed:', error);
        }
    }

    async processSingleVerification(bulkId, record, index) {
        try {
            // This would process each record in the bulk file
            // For now, we'll simulate the process

            const institution = await this.institutionRepository.findByName(record.institutionName);
            if (!institution) {
                throw new Error(`Institution not found: ${record.institutionName}`);
            }

            // Simulate AI processing
            const aiResult = await this.aiAgentService.processVerification(
                `bulk-${bulkId}-${index}`,
                record.certificateData,
                record.consentData
            );

            const isSuccessful = aiResult.confidenceScore >= 0.85;

            // Record result
            await this.bulkVerificationRepository.addResult(bulkId, {
                recordIndex: index,
                institution: record.institutionName,
                studentName: record.studentName,
                status: isSuccessful ? 'completed' : 'failed',
                confidenceScore: aiResult.confidenceScore,
                timestamp: new Date()
            });

            if (isSuccessful) {
                await this.bulkVerificationRepository.incrementSuccessCount(bulkId);
            } else {
                await this.bulkVerificationRepository.incrementFailedCount(bulkId);
            }

        } catch (error) {
            await this.bulkVerificationRepository.addResult(bulkId, {
                recordIndex: index,
                institution: record.institutionName,
                studentName: record.studentName,
                status: 'error',
                error: error.message,
                timestamp: new Date()
            });

            await this.bulkVerificationRepository.incrementFailedCount(bulkId);
        }
    }
}

module.exports = ProcessBulkVerification;