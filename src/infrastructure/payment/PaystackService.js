const IPaymentService = require('../../domain/interfaces/IPaymentService');

const axios = require('axios');
const crypto = require('crypto');

class PaystackService extends IPaymentService {
    constructor() {
        super();
        this.secretKey =  process.env.PAYSTACK_SECRET_KEY;
        this.publicKey = process.env.PAYSTACK_PUBLIC_KEY;
        this.baseUrl = 'https://api.paystack.co';
        
        this.axiosInstance = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'Authorization': `Bearer ${this.secretKey}`,
                'Content-Type': 'application/json',
                'User-Agent': 'Hakika-Payment/1.0'
            },
            timeout: 30000
        });
    }

    async initializePayment(amount, email, metadata = {}, currency = 'USD') {
        try {
            // Convert amount to smallest currency unit (kobo/pesewas for GHS, cents for USD)
            const amountInSmallestUnit = Math.round(amount * 100);
            
            const payload = {
                email,
                amount: amountInSmallestUnit,
                currency: currency.toUpperCase(),
                metadata,
                callback_url: `${process.env.APP_URL}/payments/verify`
            };

            const response = await this.axiosInstance.post('/transaction/initialize', payload);
            
            if (response.data.status !== true) {
                throw new Error(response.data.message || 'Payment initialization failed');
            }

            return {
                success: true,
                reference: response.data.data.reference,
                authorizationUrl: response.data.data.authorization_url,
                accessCode: response.data.data.access_code
            };
        } catch (error) {
            console.error('Paystack initialization error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    async verifyPayment(reference) {
        try {
            const response = await this.axiosInstance.get(`/transaction/verify/${reference}`);
            
            if (response.data.status !== true) {
                throw new Error(response.data.message || 'Payment verification failed');
            }

            const data = response.data.data;
            
            return {
                success: data.status === 'success',
                amount: data.amount / 100,
                currency: data.currency,
                reference: data.reference,
                paidAt: data.paid_at,
                customer: data.customer,
                metadata: data.metadata,
                status: data.status,
                gatewayResponse: data.gateway_response
            };
        } catch (error) {
            console.error('Paystack verification error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    async chargeCard(email, amount, card, metadata = {}, currency = 'USD') {
        try {
            const amountInSmallestUnit = Math.round(amount * 100);
            
            const payload = {
                email,
                amount: amountInSmallestUnit,
                currency: currency.toUpperCase(),
                card: {
                    number: card.number.replace(/\s/g, ''),
                    cvv: card.cvc,
                    expiry_month: card.expiry.split('/')[0],
                    expiry_year: card.expiry.split('/')[1],
                    ...(card.name && { name: card.name })
                },
                metadata,
                pin: card.pin // Optional for Ghanaian cards
            };

            const response = await this.axiosInstance.post('/transaction/charge_authorization', payload);
            
            if (response.data.status !== true) {
                throw new Error(response.data.message || 'Card charge failed');
            }

            const data = response.data.data;
            
            return {
                success: data.status === 'success',
                reference: data.reference,
                authorization: data.authorization,
                amount: data.amount / 100,
                currency: data.currency,
                metadata: data.metadata,
                status: data.status,
                message: data.gateway_response
            };
        } catch (error) {
            console.error('Paystack card charge error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message,
                requiresPin: error.response?.data?.data?.requiresPin || false,
                requiresOTP: error.response?.data?.data?.requiresOTP || false
            };
        }
    }

    async chargeMobileMoney(email, amount, phone, provider = 'MTN', metadata = {}, currency = 'GHS') {
        try {
            const amountInSmallestUnit = Math.round(amount * 100);
            
            const payload = {
                email,
                amount: amountInSmallestUnit,
                currency: currency.toUpperCase(),
                mobile_money: {
                    phone,
                    provider: provider.toUpperCase()
                },
                metadata
            };

            const response = await this.axiosInstance.post('/charge', payload);
            
            if (response.data.status !== true) {
                throw new Error(response.data.message || 'Mobile money charge failed');
            }

            const data = response.data.data;
            
            return {
                success: data.status === 'success',
                reference: data.reference,
                amount: data.amount / 100,
                currency: data.currency,
                status: data.status,
                message: data.message || 'Payment request sent to mobile device',
                requiresPin: data.requiresPin || false
            };
        } catch (error) {
            console.error('Paystack mobile money error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    async submitPin(reference, pin) {
        try {
            const response = await this.axiosInstance.post('/charge/submit_pin', {
                pin,
                reference
            });

            if (response.data.status !== true) {
                throw new Error(response.data.message || 'PIN submission failed');
            }

            const data = response.data.data;
            
            return {
                success: data.status === 'success',
                reference: data.reference,
                amount: data.amount / 100,
                currency: data.currency,
                status: data.status,
                message: data.gateway_response
            };
        } catch (error) {
            console.error('Paystack PIN submission error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    async submitOTP(reference, otp) {
        try {
            const response = await this.axiosInstance.post('/charge/submit_otp', {
                otp,
                reference
            });

            if (response.data.status !== true) {
                throw new Error(response.data.message || 'OTP submission failed');
            }

            const data = response.data.data;
            
            return {
                success: data.status === 'success',
                reference: data.reference,
                amount: data.amount / 100,
                currency: data.currency,
                status: data.status,
                message: data.gateway_response
            };
        } catch (error) {
            console.error('Paystack OTP submission error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    async createTransferRecipient(accountDetails) {
        try {
            const response = await this.axiosInstance.post('/transferrecipient', accountDetails);
            
            if (response.data.status !== true) {
                throw new Error(response.data.message || 'Transfer recipient creation failed');
            }

            return {
                success: true,
                recipientCode: response.data.data.recipient_code,
                details: response.data.data
            };
        } catch (error) {
            console.error('Paystack transfer recipient error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    async initiateTransfer(amount, recipient, reason, currency = 'GHS') {
        try {
            const amountInSmallestUnit = Math.round(amount * 100);
            
            const payload = {
                source: 'balance',
                amount: amountInSmallestUnit,
                recipient,
                currency: currency.toUpperCase(),
                reason
            };

            const response = await this.axiosInstance.post('/transfer', payload);
            
            if (response.data.status !== true) {
                throw new Error(response.data.message || 'Transfer initiation failed');
            }

            return {
                success: true,
                transferCode: response.data.data.transfer_code,
                reference: response.data.data.reference,
                status: response.data.data.status
            };
        } catch (error) {
            console.error('Paystack transfer error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    async listBanks(country = 'GHANA') {
        try {
            const response = await this.axiosInstance.get(`/bank?country=${country}`);
            
            if (response.data.status !== true) {
                throw new Error(response.data.message || 'Failed to fetch banks');
            }

            return {
                success: true,
                banks: response.data.data
            };
        } catch (error) {
            console.error('Paystack banks error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    verifyWebhookSignature(payload, signature) {
        try {
            const hash = crypto.createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET)
                .update(JSON.stringify(payload))
                .digest('hex');
            
            return hash === signature;
        } catch (error) {
            console.error('Webhook signature verification error:', error);
            return false;
        }
    }

    getPublicKey() {
        return this.publicKey;
    }
}

module.exports = PaystackService;