class GetInstiutionResponseByVerificationId {
    constructor(instResponseRepository) {
        this.instResponseRepository = instResponseRepository;
    }

    async execute(verificationId) {
        return await this.instResponseRepository.findByVerificationId(verificationId);
    }
}

module.exports = GetInstiutionResponseByVerificationId; 