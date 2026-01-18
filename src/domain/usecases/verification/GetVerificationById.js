class GetVerificationById {
    constructor(verificationRepository) {
        this.verificationRepository = verificationRepository;
    }

    async execute(userId, id) {
        return await this.verificationRepository.findById(userId, id); 
    }
}

module.exports = GetVerificationById; 