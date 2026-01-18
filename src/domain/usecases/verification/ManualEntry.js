
class ManualEntry  {
    constructor(verificationRepository, institutionResponseRepository, apiClient) {
        this.verificationRepository = verificationRepository;
        this.institutionResponseRepository = institutionResponseRepository;
        this.apiClient = apiClient;
    }

    async execute(verificationId, entryData, enteredBy) {
        const institutionResponse = await this.institutionResponseRepository.findByVerificationId(verificationId);
        if (!institutionResponse) {
            throw new Error('Institution response not found');
        }

        if (!institutionResponse.canProcess()) {
            throw new Error(`Cannot process response with status: ${institutionResponse.status}`);
        }

        const updates = {
            responseData: entryData.data,
            verificationScore: entryData.verificationScore,
            status: entryData.status,
            responseType: 'manual',
            processedBy: enteredBy,
            processedAt: new Date(),
            notes: entryData.notes,
            isVerified: entryData.verificationScore >= 80,
            verificationMethod: 'manual_entry',
            metadata: {
                ...institutionResponse.metadata,
                manualEntryBy: enteredBy,
                manualEntryAt: new Date()
            }
        };

        return await this.institutionResponseRepository.update(institutionResponse.id, updates);
    }
}

module.exports = ManualEntry;