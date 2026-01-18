class ProcessVerificationWithAI {
    constructor(
        verificationRepository,
        aiAgentService,
        emailService
    ) {
        this.verificationRepository = verificationRepository;
        this.aiAgentService = aiAgentService;
        this.emailService = emailService;
    }

    async execute(verificationId) {
        const verification = await this.verificationRepository.findById(verificationId);

        if (!verification) {
            throw new Error('Verification not found');
        }

        if (verification.status !== 'pending') {
            throw new Error('Verification already processed');
        }

        // Update status to processing
        await this.verificationRepository.updateStatus(verificationId, 'processing');

        try {
            // Process with AI agent
            const aiResult = await this.aiAgentService.processVerification(
                verificationId,
                verification.certificateFile,
                verification.consentFile
            );

            // Determine final status based on AI confidence
            const finalStatus = aiResult.confidenceScore >= 0.85 ? 'completed' : 'failed';

            // Update verification with AI results
            const updatedVerification = await this.verificationRepository.updateStatus(
                verificationId,
                finalStatus,
                JSON.stringify(aiResult)
            );

            // Send notification email
            await this.emailService.sendVerificationResult(
                verification.userId,
                verificationId,
                finalStatus,
                aiResult
            );

            return {
                verification: updatedVerification.toJSON(),
                aiResult
            };

        } catch (error) {
            // If AI processing fails, mark as failed
            await this.verificationRepository.updateStatus(
                verificationId,
                'failed',
                JSON.stringify({ error: error.message })
            );

            throw error;
        }
    }
}

module.exports = ProcessVerificationWithAI;