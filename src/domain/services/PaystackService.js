const axios = require('axios');
const app = require('../../config/app');

const Paystack = require('paystack')(process.env.PAYSTACK_SECRET_KEY);

class PaystackService {
    constructor() {
        this.axiosInstance = axios.create({
            baseURL: process.env.BASE_URL,
            headers: {
                'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json'
            }
        });
    }

    async initializeTransaction(data) {
        try {
            const response = await this.axiosInstance.post('/transaction/initialize', data);
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            console.error('Paystack initialization error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    async chargeCard(data) {
        try {
            const response = await this.axiosInstance.post('/transaction/charge_authorization', data);
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            console.error('Paystack card charge error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    async chargeMobileMoney(data) {
        try {
            const response = await this.axiosInstance.post('/charge', data);
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            console.error('Paystack mobile money charge error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    async verifyTransaction(reference) {
        try {
            const response = await this.axiosInstance.get(`/transaction/verify/${reference}`);
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            console.error('Paystack verification error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    async listBanks(country = 'ghana') {
        try {
            const response = await this.axiosInstance.get(`/bank?country=${country}`);
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            console.error('Paystack bank list error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    async createTransferRecipient(data) {
        try {
            const response = await this.axiosInstance.post('/transferrecipient', data);
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            console.error('Paystack recipient error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    async initiateTransfer(data) {
        try {
            const response = await this.axiosInstance.post('/transfer', data);
            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            console.error('Paystack transfer error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    verifyWebhookSignature(payload, signature) {
        const crypto = require('crypto');
        const hash = crypto.createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET)
            .update(JSON.stringify(payload))
            .digest('hex');
        return hash === signature;
    }
}

module.exports = PaystackService;