const { validationResult } = require('express-validator');

class PaymentController {
    constructor(
        addFundsUseCase,
        getWalletBalanceUseCase,
        paymentService,
        transactionRepository,
        walletRepository
    ) {
        this.addFundsUseCase = addFundsUseCase;
        this.getWalletBalanceUseCase = getWalletBalanceUseCase;
        this.paymentService = paymentService;
        this.transactionRepository = transactionRepository;
        this.walletRepository = walletRepository;
    }

    async showAddFunds(req, res) {
        try {
            const userId = req.user.id;
            
            // Get current balance
            const balanceResult = await this.getWalletBalanceUseCase.execute(userId);
            
            // Get user's country for mobile money availability
            const user = req.user; // Assuming user object is attached by auth middleware
            
            res.render('money/add-funds', {
                title: 'Add Funds',
                user: req.user,
                currentBalance: balanceResult.balance || 0,
                currency: balanceResult.currency || 'USD',
                country: user.country || 'GH', // Show mobile money if Ghana
                paystackPublicKey: this.paymentService.getPublicKey(),
                csrfToken: req.csrfToken?.() || ''
            });
        } catch (error) {
            console.error('Error loading add funds page:', error);
            req.flash('error', 'Failed to load payment page');
            res.redirect('/dashboard');
        }
    }

    async showWallet(req, res) {
        try {
            const userId = req.user.id;
            
            const balanceResult = await this.getWalletBalanceUseCase.execute(userId);
            const transactions = await this.transactionRepository.findByUserId(userId, 20);
            
            res.render('payments/wallet', {
                title: 'Wallet',
                user: req.user,
                balance: balanceResult.balance || 0,
                currency: balanceResult.currency || 'USD',
                transactions: transactions || [],
                csrfToken: req.csrfToken?.() || ''
            });
        } catch (error) {
            console.error('Error loading wallet:', error);
            req.flash('error', 'Failed to load wallet');
            res.redirect('/dashboard');
        }
    }

    async getBalance(req, res) {
        try {
            const userId = req.user.id;
            const result = await this.getWalletBalanceUseCase.execute(userId);
            
            res.json({
                success: true,
                data: {
                    balance: result.balance,
                    currency: result.currency
                }
            });
        } catch (error) {
            console.error('Error getting balance:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get wallet balance'
            });
        }
    }

    async initializePayment(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const userId = req.user.id;
            const { 
                amount, 
                paymentMethod, 
                currency = 'USD',
                provider, 
                phoneNumber,
                card 
            } = req.body;
            console.log(paymentMethod, card);
            // Prepare metadata
            const metadata = {
                currency,
                userEmail: req.user.email,
                userName: req.user.fullName
            };

            // Add payment method specific data
            if (paymentMethod === 'mobile_money' || paymentMethod === 'momo') {
                if (!provider || !phoneNumber) {
                    return res.status(400).json({
                        success: false,
                        message: 'Provider and phone number are required for mobile money'
                    });
                }
                metadata.provider = provider;
                metadata.phone = phoneNumber;
            } else if (paymentMethod === 'card' && card) {
                metadata.card = card;
            }

            // Execute add funds use case
            const result = await this.addFundsUseCase.execute(
                userId,
                parseFloat(amount),
                paymentMethod,
                metadata
            );

            res.json({
                success: true,
                data: result
            });

        } catch (error) {
            console.error('Payment initialization error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Payment initialization failed'
            });
        }
    }

    async verifyPayment(req, res) {
        try {
            const { reference } = req.query;
            
            if (!reference) {
                req.flash('error', 'Payment reference is required');
                return res.redirect('/payments/add-funds');
            }

            const result = await this.addFundsUseCase.handlePaymentCallback(reference);

            if (result.success) {
                req.flash('success', `Successfully added ${result.currency} ${result.amount} to your wallet`);
                return res.redirect('/payments/wallet');
            } else {
                req.flash('error', result.message || 'Payment verification failed');
                return res.redirect('/payments/add-funds');
            }
        } catch (error) {
            console.error('Payment verification error:', error);
            req.flash('error', error.message || 'Payment verification failed');
            res.redirect('/payments/add-funds');
        }
    }

    async submitPin(req, res) {
        try {
            const { reference, pin } = req.body;
            
            if (!reference || !pin) {
                return res.status(400).json({
                    success: false,
                    message: 'Reference and PIN are required'
                });
            }

            const result = await this.addFundsUseCase.handlePaymentCallback(reference, pin, null);

            res.json({
                success: result.success,
                message: result.message,
                data: {
                    newBalance: result.newBalance,
                    amount: result.amount
                }
            });
        } catch (error) {
            console.error('PIN submission error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'PIN submission failed'
            });
        }
    }

    async submitOTP(req, res) {
        try {
            const { reference, otp } = req.body;
            
            if (!reference || !otp) {
                return res.status(400).json({
                    success: false,
                    message: 'Reference and OTP are required'
                });
            }

            const result = await this.addFundsUseCase.handlePaymentCallback(reference, null, otp);

            res.json({
                success: result.success,
                message: result.message,
                data: {
                    newBalance: result.newBalance,
                    amount: result.amount
                }
            });
        } catch (error) {
            console.error('OTP submission error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'OTP submission failed'
            });
        }
    }

    async handleWebhook(req, res) {
        try {
            // Verify webhook signature
            const signature = req.headers['x-paystack-signature'];
            const payload = req.body;

            const isValid = this.paymentService.verifyWebhookSignature(payload, signature);
            
            if (!isValid) {
                console.error('Invalid webhook signature');
                return res.status(400).send('Invalid signature');
            }

            const event = payload.event;
            const data = payload.data;

            console.log(`Received webhook event: ${event}`, data.reference);

            switch (event) {
                case 'charge.success':
                    await this.handleSuccessfulCharge(data);
                    break;

                case 'transfer.success':
                    await this.handleSuccessfulTransfer(data);
                    break;

                case 'charge.failed':
                    await this.handleFailedCharge(data);
                    break;

                default:
                    console.log(`Unhandled webhook event: ${event}`);
            }

            res.sendStatus(200);
        } catch (error) {
            console.error('Webhook processing error:', error);
            res.status(500).send('Webhook processing failed');
        }
    }

    async handleSuccessfulCharge(chargeData) {
        try {
            const reference = chargeData.reference;
            
            // Update transaction status
            await this.addFundsUseCase.completePayment({
                success: true,
                reference: chargeData.reference,
                amount: chargeData.amount / 100,
                currency: chargeData.currency,
                paidAt: chargeData.paid_at,
                message: chargeData.gateway_response,
                metadata: chargeData.metadata
            }, reference);
            
            console.log(`Payment completed successfully for reference: ${reference}`);
        } catch (error) {
            console.error('Error handling successful charge:', error);
        }
    }

    async handleFailedCharge(chargeData) {
        try {
            const reference = chargeData.reference;
            
            await this.transactionRepository.updateStatus(reference, 'failed', {
                error: chargeData.gateway_response,
                gatewayReference: chargeData.reference
            });
            
            console.log(`Payment failed for reference: ${reference}`);
        } catch (error) {
            console.error('Error handling failed charge:', error);
        }
    }

    async handleSuccessfulTransfer(transferData) {
        // Handle successful transfers (for withdrawals)
        console.log('Transfer successful:', transferData.reference);
    }

    async getPaymentStatus(req, res) {
        try {
            const { reference } = req.params;
            
            const status = await this.addFundsUseCase.getPaymentStatus(reference);
            
            res.json({
                success: true,
                data: status
            });
        } catch (error) {
            console.error('Error getting payment status:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to get payment status'
            });
        }
    }

    async getBanks(req, res) {
        try {
            const { country = 'GHANA' } = req.query;
            
            const result = await this.paymentService.listBanks(country);
            
            if (!result.success) {
                throw new Error(result.error);
            }

            res.json({
                success: true,
                data: result.banks
            });
        } catch (error) {
            console.error('Error getting banks:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to get banks list'
            });
        }
    }

    async showPaymentProcessing(req, res) {
        try {
            const { reference, method } = req.query;
            
            if (!reference) {
                req.flash('error', 'Payment reference is required');
                return res.redirect('/payments/add-funds');
            }

            // Get transaction details
            const transaction = await this.transactionRepository.findByReference(reference);
            if (!transaction) {
                req.flash('error', 'Transaction not found');
                return res.redirect('/payments/add-funds');
            }

            res.render('payments/processing', {
                title: 'Payment Processing',
                reference,
                method: method || transaction.paymentMethod,
                amount: transaction.amount,
                currency: transaction.currency,
                requiresPin: transaction.metadata?.requiresPin || false,
                requiresOTP: transaction.metadata?.requiresOTP || false,
                csrfToken: req.csrfToken?.() || ''
            });
        } catch (error) {
            console.error('Error loading processing page:', error);
            req.flash('error', 'Failed to load payment processing page');
            res.redirect('/payments/add-funds');
        }
    }
}

module.exports = PaymentController;