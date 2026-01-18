class IPaymentService {
    async initializePayment(amount, currency, paymentMethod, metadata) {
        throw new Error('Method not implemented');
    }

    async verifyPayment(reference) {
        throw new Error('Method not implemented');
    }

    async chargeCard(cardData, metadata) {
        throw new Error('Method not implemented');
    }

    async chargeMobileMoney(momoData, metadata) {
        throw new Error('Method not implemented');
    }

    async submitPin(reference, pin) {
        throw new Error('Method not implemented');
    }

    async submitOTP(reference, otp) {
        throw new Error('Method not implemented');
    }
}

module.exports = IPaymentService;