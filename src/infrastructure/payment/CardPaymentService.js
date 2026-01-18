const IPaymentService = require('../../domain/interfaces/IPaymentService');
const Stripe = require('stripe');

class CardPaymentService extends IPaymentService {
    constructor() {
        super();
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2023-10-16', // Use latest stable version
            timeout: 10000
        });
    }

    async initializePayment(amount, currency, paymentMethod, metadata) {
        try {
            // Convert amount to cents (Stripe uses smallest currency unit)
            const amountInCents = Math.round(amount * 100);

            const paymentIntent = await this.stripe.paymentIntents.create({
                amount: amountInCents,
                currency: currency.toLowerCase(),
                automatic_payment_methods: {
                    enabled: true,
                },
                metadata: {
                    description: metadata.description,
                    userId: metadata.userId,
                    service: 'academic-verification'
                },
                description: `Academic verification payment - ${metadata.description || 'Service'}`,
                capture_method: 'automatic'
            });

            return {
                success: true,
                reference: paymentIntent.id,
                clientSecret: paymentIntent.client_secret,
                amount: amount,
                currency: currency,
                metadata: metadata,
                requires3DS: paymentIntent.status === 'requires_action',
                paymentIntentId: paymentIntent.id
            };

        } catch (error) {
            console.error('Stripe initialization error:', error);
            return {
                success: false,
                error: error.message,
                reference: null
            };
        }
    }

    async verifyPayment(reference) {
        try {
            const paymentIntent = await this.stripe.paymentIntents.retrieve(reference);

            const isSuccessful = paymentIntent.status === 'succeeded';
            const requiresAction = paymentIntent.status === 'requires_action';

            return {
                success: isSuccessful,
                reference: reference,
                status: paymentIntent.status,
                message: this.getStatusMessage(paymentIntent.status),
                amount: paymentIntent.amount / 100, // Convert back to dollars
                currency: paymentIntent.currency,
                requiresAction: requiresAction,
                paymentMethod: paymentIntent.payment_method
            };

        } catch (error) {
            console.error('Stripe verification error:', error);
            return {
                success: false,
                reference: reference,
                status: 'failed',
                message: error.message
            };
        }
    }

    async processWebhook(payload, signature) {
        try {
            const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

            // Verify webhook signature
            const event = this.stripe.webhooks.constructEvent(
                payload,
                signature,
                webhookSecret
            );

            let status = 'failed';
            let success = false;

            switch (event.type) {
                case 'payment_intent.succeeded':
                    status = 'success';
                    success = true;
                    break;
                case 'payment_intent.payment_failed':
                    status = 'failed';
                    success = false;
                    break;
                case 'payment_intent.requires_action':
                    status = 'requires_action';
                    success = false;
                    break;
                default:
                    return {
                        success: false,
                        eventType: event.type,
                        message: 'Unhandled event type'
                    };
            }

            const paymentIntent = event.data.object;

            return {
                success: success,
                reference: paymentIntent.id,
                status: status,
                amount: paymentIntent.amount / 100,
                currency: paymentIntent.currency,
                eventType: event.type,
                rawEvent: event
            };

        } catch (error) {
            console.error('Stripe webhook error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    getStatusMessage(status) {
        const messages = {
            'succeeded': 'Payment completed successfully',
            'processing': 'Payment is processing',
            'requires_payment_method': 'Please provide payment method',
            'requires_action': 'Additional authentication required',
            'requires_capture': 'Payment requires capture',
            'canceled': 'Payment canceled',
            'failed': 'Payment failed'
        };
        return messages[status] || 'Unknown status';
    }

    // Additional method for handling 3D Secure
    async confirmPayment(reference, paymentMethodId) {
        try {
            const paymentIntent = await this.stripe.paymentIntents.confirm(
                reference,
                { payment_method: paymentMethodId }
            );

            return {
                success: paymentIntent.status === 'succeeded',
                reference: reference,
                status: paymentIntent.status,
                requiresAction: paymentIntent.status === 'requires_action'
            };

        } catch (error) {
            console.error('Stripe confirmation error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = CardPaymentService;