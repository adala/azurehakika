

class CreateInstitutionResponse {
    constructor(institutionResponseRepository) {
        this.institutionResponseRepository = institutionResponseRepository;
    }
    async execute({ verificationId, institutionId, responseType = 'manual', assignedBy }) {
        // Check if response already exists
        const existing = await institutionResponseRepository.findByVerificationId(verificationId);
        if (existing) {
            throw new Error('Institution response already exists for this verification');
        }

        const response = {
            verificationId,
            institutionId,
            responseType,
            status: 'pending',
            responseData: {},
            verificationScore: 0,
            confidenceScore: 0,
            flags: [],
            metadata: {
                assignedBy,
                assignedAt: new Date()
            },
            attachments: []
        };

        return await this.institutionResponseRepository.create(response);
    }
}

module.exports = CreateInstitutionResponse;