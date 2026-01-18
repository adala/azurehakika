
class ProcessManualVerification {
    constructor(
        assignmentRepository,
        verificationRepository,
        institutionResponseRepository,
    ) {
        this.assignmentRepository = assignmentRepository;
        this.verificationRepository = verificationRepository;
        this.institutionResponseRepository = institutionResponseRepository;
    }
    async execute(assignmentId, manualData, assigneeId) {
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

        // 3. Get verification
        const verification = await this.verificationRepository.findById(assignment.verificationId);

        // 4. Create institution response with manual data
        const institutionResponse = await this.institutionResponseRepository.create({
            verificationId: verification.id,
            institutionId: assignment.institutionId,
            requestId: `MANUAL-${Date.now()}`,
            responseData: manualData.data,
            verificationScore: manualData.verificationScore,
            status: manualData.status || 'completed',
            responseType: 'manual',
            processedBy: assigneeId,
            processedAt: new Date(),
            confidenceScore: manualData.confidenceScore || manualData.verificationScore,
            flags: manualData.flags || [],
            metadata: {
                entryMethod: 'manual_web_form',
                entryDuration: manualData.entryDuration,
                enteredAt: new Date()
            },
            notes: manualData.notes,
            isVerified: manualData.verificationScore >= 80,
            verificationMethod: 'manual_entry'
        });

        // 5. Update assignment status
        await this.assignmentRepository.updateStatus(assignmentId, 'completed');

        // 6. Update verification status
        await this.verificationRepository.updateStatus(verification.id, 
            manualData.status || 'completed'
        );

        return {
            success: true,
            institutionResponse
        };
    }
}

module.exports = ProcessManualVerification;