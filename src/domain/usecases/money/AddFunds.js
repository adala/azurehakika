class AddFunds {
    constructor(
        walletRepository,
        transactionRepository,
        userRepository,
        paymentService,
        emailService
    ) {
        this.walletRepository = walletRepository;
        this.transactionRepository = transactionRepository;
        this.paymentService = paymentService;
        this.emailService = emailService;
        this.userRepository = userRepository;
    }

    async execute(userId, amount, paymentMethod, metadata = {}) {
        if (amount <= 0) {
            throw new Error('Amount must be greater than zero');
        }
        
        // Get user details for payment
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        
        // Get user's wallet
        let wallet = await this.walletRepository.findByUserId(userId);
        if (!wallet) {
            wallet = await this.walletRepository.create({
                userId,
                balance: 0,
                currency: metadata.currency || 'USD'
            });
        }
        
        // Create transaction record
        const reference = `TOPUP_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
       
        const transaction = await this.transactionRepository.create({
            userId,
            walletId: wallet.id,
            type: 'topup',
            amount,
            currency: metadata.currency || 'USD',
            reference,
            status: 'pending',
            description: `Wallet topup via ${paymentMethod}`,
            paymentMethod: paymentMethod.toLowerCase(),
            metadata: {
                ...metadata,
                userId,
                walletId: wallet.id
            }
        });
        
        // Prepare payment metadata
        const paymentMetadata = {
            userId,
            transactionId: transaction.id,
            walletId: wallet.id,
            userEmail: user.email,
            userName: user.fullName,
            purpose: 'wallet_topup',
            ...metadata
        };
     
        // Initialize payment based on method
        let paymentResult;
        
        try {
            switch (paymentMethod.toLowerCase()) {
                case 'card':
                    if (!metadata.card) {
                        throw new Error('Card details required for card payment');
                    }
                    paymentResult = await this.paymentService.chargeCard(
                        metadata.card,
                        {
                            ...paymentMetadata,
                            amount,
                            currency: metadata.currency || 'USD'
                        }
                    );
                    break;

                case 'mobile_money':
                case 'momo':
                    if (!metadata.phone || !metadata.provider) {
                        throw new Error('Phone and provider required for mobile money');
                    }
                    paymentResult = await this.paymentService.chargeMobileMoney(
                        {
                            phone: metadata.phone,
                            provider: metadata.provider
                        },
                        {
                            ...paymentMetadata,
                            amount,
                            currency: metadata.currency || 'GHS'
                        }
                    );
                    break;

                default:
                    // Standard Paystack redirect flow
                    paymentResult = await this.paymentService.initializePayment(
                        amount,
                        metadata.currency || 'USD',
                        paymentMethod,
                        paymentMetadata
                    );
            }

            if (!paymentResult.success) {
                await this.transactionRepository.updateStatus(reference, 'failed', {
                    error: paymentResult.error,
                    gatewayResponse: paymentResult.message
                });
                
                throw new Error(paymentResult.error || 'Payment initialization failed');
            }

            // Update transaction with payment reference
            await this.transactionRepository.updatePaymentReference(
                reference,
                paymentResult.reference,
                {
                    authorizationUrl: paymentResult.authorizationUrl,
                    requiresPin: paymentResult.requiresPin,
                    requiresOTP: paymentResult.requiresOTP
                }
            );

            return {
                success: true,
                transactionId: transaction.id,
                reference: paymentResult.reference,
                paymentUrl: paymentResult.authorizationUrl,
                amount,
                currency: metadata.currency || 'USD',
                requiresPin: paymentResult.requiresPin || false,
                requiresOTP: paymentResult.requiresOTP || false,
                message: paymentResult.message || 'Payment initialized successfully'
            };

        } catch (error) {
            console.log('Error in AddFunds use case: ', error.message);
            await this.transactionRepository.updateStatus(reference, 'failed', {
                error: error.message
            });
            throw error;
        }
    }

    async handlePaymentCallback(reference, pin = null, otp = null) {
        // Verify payment with gateway
        const verificationResult = await this.paymentService.verifyPayment(reference);

        if (!verificationResult.success) {
            // Check if PIN/OTP is required
            if (verificationResult.requiresPin && pin) {
                const pinResult = await this.paymentService.submitPin(reference, pin);
                return await this.handlePinSubmission(pinResult, reference);
            }

            if (verificationResult.requiresOTP && otp) {
                const otpResult = await this.paymentService.submitOTP(reference, otp);
                return await this.handleOTPSubmission(otpResult, reference);
            }

            await this.transactionRepository.updateStatus(reference, 'failed', {
                error: verificationResult.error,
                gatewayResponse: verificationResult.message
            });
            
            throw new Error(`Payment failed: ${verificationResult.error}`);
        }

        return await this.completePayment(verificationResult, reference);
    }

    async handlePinSubmission(pinResult, reference) {
        if (!pinResult.success) {
            await this.transactionRepository.updateStatus(reference, 'failed', {
                error: pinResult.error,
                gatewayResponse: pinResult.message
            });
            throw new Error(`PIN submission failed: ${pinResult.error}`);
        }

        return await this.completePayment(pinResult, reference);
    }

    async handleOTPSubmission(otpResult, reference) {
        if (!otpResult.success) {
            await this.transactionRepository.updateStatus(reference, 'failed', {
                error: otpResult.error,
                gatewayResponse: otpResult.message
            });
            throw new Error(`OTP submission failed: ${otpResult.error}`);
        }

        return await this.completePayment(otpResult, reference);
    }

    async completePayment(paymentResult, reference) {
        // Get transaction
        const transaction = await this.transactionRepository.findByReference(reference);
        if (!transaction) {
            throw new Error('Transaction not found');
        }

        // Update transaction status
        const updatedTransaction = await this.transactionRepository.updateStatus(
            reference,
            paymentResult.success ? 'completed' : 'failed',
            {
                paidAt: paymentResult.paidAt,
                gatewayReference: paymentResult.reference,
                gatewayResponse: paymentResult.message,
                metadata: paymentResult.metadata
            }
        );

        if (paymentResult.success) {
            // Add funds to wallet
            const wallet = await this.walletRepository.updateBalance(
                transaction.userId,
                transaction.amount,
                'credit'
            );

            // Send confirmation email
            const user = await this.userRepository.findById(transaction.userId);
            if (user && user.email) {
                await this.emailService.sendPaymentConfirmation(
                    user.email,
                    transaction.amount,
                    transaction.currency,
                    wallet.balance
                );
            }

            return {
                success: true,
                amount: transaction.amount,
                newBalance: wallet.balance,
                currency: transaction.currency,
                transactionId: transaction.id,
                message: 'Funds added successfully'
            };
        } else {
            return {
                success: false,
                error: paymentResult.error,
                message: 'Payment failed'
            };
        }
    }

    async getPaymentStatus(reference) {
        const transaction = await this.transactionRepository.findByReference(reference);
        if (!transaction) {
            throw new Error('Transaction not found');
        }

        return {
            status: transaction.status,
            amount: transaction.amount,
            currency: transaction.currency,
            createdAt: transaction.createdAt,
            updatedAt: transaction.updatedAt,
            metadata: transaction.metadata
        };
    }
}

module.exports = AddFunds;