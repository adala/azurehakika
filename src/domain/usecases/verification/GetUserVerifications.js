class GetUserVerifications {
    constructor(verificationRepository) {
        this.verificationRepository = verificationRepository;
    }

    async execute(userId, status = null) {
        let verifications;

        if (status) {
            verifications = await this.verificationRepository.findByStatus(userId, status);
        } else {
            verifications = await this.verificationRepository.findByUserId(userId);
        }

        return verifications.map(verification => verification.toJSON());
    }
}

module.exports = GetUserVerifications; 