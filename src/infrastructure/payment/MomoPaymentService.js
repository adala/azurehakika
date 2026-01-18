const IPaymentService = require('../../domain/interfaces/IPaymentService');
const axios = require('axios');
const crypto = require('crypto');

class MomoPaymentService extends IPaymentService {
    constructor() {
        super();
        this.partnerCode = process.env.MOMO_PARTNER_CODE;
        this.accessKey = process.env.MOMO_ACCESS_KEY;
        this.secretKey = process.env.MOMO_SECRET_KEY;
        this.baseUrl = process.env.MOMO_BASE_URL || 'https://test-payment.momo.vn';
    }

    async initializePayment(amount, currency, paymentMethod, metadata) {
        try {
            const requestId = this.partnerCode + Date.now();
            const orderId = requestId;
            const orderInfo = `Payment for ${metadata.description || 'services'}`;
            const redirectUrl = process.env.MOMO_REDIRECT_URL;
            const ipnUrl = process.env.MOMO_WEBHOOK_URL;
            const requestType = 'captureWallet'; // or 'payWithMethod' for multiple methods
            
            // Create signature
            const rawSignature = `accessKey=${this.accessKey}&amount=${amount}&extraData=&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${this.partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
            const signature = crypto.createHmac('sha256', this.secretKey)
                .update(rawSignature)
                .digest('hex');

            const requestBody = {
                partnerCode: this.partnerCode,
                partnerName: "Your Business Name",
                storeId: this.partnerCode,
                requestId: requestId,
                amount: amount,
                orderId: orderId,
                orderInfo: orderInfo,
                redirectUrl: redirectUrl,
                ipnUrl: ipnUrl,
                lang: 'en',
                requestType: requestType,
                autoCapture: true,
                extraData: '',
                orderGroupId: '',
                signature: signature
            };

            const response = await axios.post(`${this.baseUrl}/v2/gateway/api/create`, requestBody, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000 // MoMo requires minimum 30s timeout[citation:3]
            });

            if (response.data.resultCode === 0) {
                return {
                    success: true,
                    reference: orderId,
                    paymentUrl: response.data.deeplink || response.data.payUrl,
                    deeplink: response.data.deeplink,
                    qrCodeUrl: response.data.qrCodeUrl,
                    amount: amount,
                    currency: currency,
                    metadata: metadata
                };
            } else {
                throw new Error(`MoMo Error: ${response.data.message} (Code: ${response.data.resultCode})`);
            }

        } catch (error) {
            console.error('MoMo initialization error:', error);
            return {
                success: false,
                error: error.message,
                reference: null
            };
        }
    }

    async verifyPayment(reference) {
        try {
            const rawSignature = `accessKey=${this.accessKey}&orderId=${reference}&partnerCode=${this.partnerCode}&requestId=${reference}`;
            const signature = crypto.createHmac('sha256', this.secretKey)
                .update(rawSignature)
                .digest('hex');

            const requestBody = {
                partnerCode: this.partnerCode,
                requestId: reference,
                orderId: reference,
                lang: 'en',
                signature: signature
            };

            const response = await axios.post(`${this.baseUrl}/v2/gateway/api/query`, requestBody, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });

            const resultCode = response.data.resultCode;
            const isSuccessful = resultCode === 0; // 0 = success in MoMo

            return {
                success: isSuccessful,
                reference: reference,
                status: isSuccessful ? 'success' : 'failed',
                message: response.data.message,
                amount: response.data.amount,
                responseData: response.data
            };

        } catch (error) {
            console.error('MoMo verification error:', error);
            return {
                success: false,
                reference: reference,
                status: 'failed',
                message: error.message
            };
        }
    }

    async processWebhook(payload) {
        try {
            // Verify webhook signature for security
            const data = payload.data || payload;
            const signature = payload.signature;
            
            // Verify the signature to ensure it's from MoMo
            const rawData = `accessKey=${this.accessKey}&amount=${data.amount}&extraData=${data.extraData || ''}&message=${data.message || ''}&orderId=${data.orderId}&orderInfo=${data.orderInfo || ''}&orderType=${data.orderType || ''}&partnerCode=${data.partnerCode}&payType=${data.payType || ''}&requestId=${data.requestId}&responseTime=${data.responseTime}&resultCode=${data.resultCode}`;
            const computedSignature = crypto.createHmac('sha256', this.secretKey)
                .update(rawData)
                .digest('hex');

            if (computedSignature !== signature) {
                throw new Error('Invalid webhook signature');
            }

            const isSuccessful = data.resultCode === 0;

            return {
                success: isSuccessful,
                reference: data.orderId,
                status: isSuccessful ? 'success' : 'failed',
                amount: data.amount,
                message: data.message,
                rawData: data
            };

        } catch (error) {
            console.error('MoMo webhook error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = MomoPaymentService;