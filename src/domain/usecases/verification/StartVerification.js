const Verification = require('../../entities/Verification');
class StartVerification {
    constructor(
        verificationRepository,
        institutionRepository,
        walletRepository,
        transactionRepository,
        fileService,
        aiAgentService,
        emailService
    ) {
        this.verificationRepository = verificationRepository;
        this.institutionRepository = institutionRepository;
        this.walletRepository = walletRepository;
        this.transactionRepository = transactionRepository;
        this.fileService = fileService;
        this.aiAgentService = aiAgentService;
        this.emailService = emailService;
    }

    async execute(data, user, files) {

        console.log('Starting verification execution:', {
            data: { ...data, consentAgreement: data.consentAgreement ? 'true' : 'false' },
            userId: user.id,
            files: files ? {
                certificate: files.certificate ? {
                    originalname: files.certificate.originalname,
                    path: files.certificate.path,
                    size: files.certificate.size
                } : null,
                consentForm: files.consentForm ? {
                    originalname: files.consentForm.originalname,
                    path: files.consentForm.path,
                    size: files.consentForm.size
                } : null
            } : null
        });

        try {
            // Validate institution
            const institution = await this.institutionRepository.findById(data.institutionId);
            if (!institution) {
                throw new Error('Institution not found');
            }

            console.log('Found institution:', institution.name);

            // Validate files exist
            if (!files || !files.certificate || !files.consentForm) {
                console.error('Files missing:', { files });
                throw new Error('Both certificate and consent form files are required');
            }

            // Upload files with error handling
            let uploadedFiles;
            try {
                uploadedFiles = {
                    certificateFile: await this.fileService.uploadFile(files.certificate),
                    consentFile: await this.fileService.uploadFile(files.consentForm)
                };
                console.log('Files uploaded successfully:', uploadedFiles);
            } catch (uploadError) {
                console.error('File upload failed:', uploadError);
                throw new Error(`File upload failed: ${uploadError.message}`);
            }

            // Generate reference number
            const referenceNumber = await this.verificationRepository.generateReferenceNumber();
            console.log('Generated reference number:', referenceNumber);

            // Create verification data object
            const verificationData = {
                userId: user.id,
                institutionId: data.institutionId,
                firstName: data.firstName,
                lastName: data.lastName,
                maidenName: data.maidenName || null,
                dateOfBirth: data.dateOfBirth,
                fieldOfStudy: data.courseName,
                courseName: data.courseName,
                degreeType: data.degreeType,
                classification: data.classification || null,
                graduationYear: parseInt(data.graduationYear),
                studentId: data.studentId || null,
                additionalNotes: data.additionalNotes || null,
                consentAgreement: data.consentAgreement === 'on' || data.consentAgreement === true,
                certificateFile: uploadedFiles.certificateFile,
                consentFile: uploadedFiles.consentFile,
                fee: institution.vfee || institution.verificationFee || 0,
                referenceNumber: referenceNumber,
                status: 'pending'
            };

            console.log('Verification data prepared:', {
                ...verificationData,
                certificateFile: '[FILE PATH]',
                consentFile: '[FILE PATH]'
            });

            // Create verification entity
            let verification;
            try {
                // Try the new method that doesn't require files parameter
                verification = Verification.createFromFormData(verificationData);

                // Alternative: If you want to use the original method signature
                // verification = Verification.createFromForm(verificationData, files);

                console.log('Verification entity created successfully');
            } catch (entityError) {
                console.error('Error creating verification entity:', entityError);
                // Fallback: create directly
                verification = new Verification(verificationData);
            }

            // Validate the verification
            let validationErrors = [];
            if (typeof verification.validate === 'function') {
                validationErrors = verification.validate();
            } else {
                // Basic validation if entity doesn't have validate method
                validationErrors = this.validateVerificationData(verificationData);
            }

            if (validationErrors.length > 0) {
                throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
            }

            console.log('Verification validation passed');

            // Check wallet balance before proceeding
            const wallet = await this.walletRepository.findByUserId(user.id);
            if (!wallet) {
                throw new Error('Wallet not found for user');
            }

            // Save verification first to get ID
            const createdVerification = await this.verificationRepository.create(verification);
            console.log('Verification created with ID:', createdVerification.id);

            const verificationFee = institution.vfee || institution.verificationFee || 0;
            
            // Create transaction for verification fee
            if (verificationFee > 0) {
                await this.transactionRepository.create({
                    userId: user.id,
                    type: 'verification_fee',
                    amount: -verificationFee,
                    currency: 'USD',
                    paymentMethod: 'card',
                    reference: `VERFEE${referenceNumber}`,
                    status: 'completed',
                    description: `Verification fee for ${institution.name}`,
                    metadata: {
                        verificationId: createdVerification.id,
                        referenceNumber: createdVerification.referenceNumber,
                        institutionId: institution.id
                    }
                });

                // Deduct fee from wallet
                await this.walletRepository.updateBalance(user.id, -verificationFee);
                console.log('Fee deducted from wallet');
            }

            // Process verification based on institution type
            if (institution.process === 'auto' || institution.process === true) {
                console.log('Starting auto-verification process');
                // AI Auto-verification
                await this.processAutoVerification(createdVerification.id);
                await this.verificationRepository.updateProcess(createdVerification.id, 'auto');
            } else {
                console.log('Starting manual verification process');
                // Manual processing
                await this.assignForManualVerification(createdVerification, user, institution);
                await this.verificationRepository.updateProcess(createdVerification.id, 'manual');
            }

            console.log('Verification process completed successfully');

            return {
                ...createdVerification.toJSON?.() || createdVerification,
                message: 'Verification started successfully'
            };


        } catch (error) {
            console.error('Error in StartVerification use case:', error);

            // Clean up uploaded files if verification failed
            if (files) {
                try {
                    if (files.certificate && files.certificate.path) {
                        await this.fileService.deleteFile(files.certificate.path);
                    }
                    if (files.consentForm && files.consentForm.path) {
                        await this.fileService.deleteFile(files.consentForm.path);
                    }
                } catch (cleanupError) {
                    console.error('Error cleaning up files:', cleanupError);
                }
            }

            throw error;

        }

    }

    // Basic validation method if entity doesn't have one
    validateVerificationData(data) {
        const errors = [];

        if (!data.firstName?.trim()) errors.push('First name is required');
        if (!data.lastName?.trim()) errors.push('Last name is required');
        if (!data.dateOfBirth) errors.push('Date of birth is required');
        if (!data.courseName?.trim()) errors.push('Course name is required');
        if (!data.degreeType?.trim()) errors.push('Degree type is required');
        if (!data.graduationYear) errors.push('Graduation year is required');
        if (!data.consentAgreement) errors.push('Consent agreement is required');

        // Validate graduation year
        if (data.graduationYear) {
            const year = parseInt(data.graduationYear);
            const currentYear = new Date().getFullYear();
            if (year < 1950 || year > currentYear) {
                errors.push('Graduation year must be between 1950 and current year');
            }
        }

        // Validate date of birth
        if (data.dateOfBirth) {
            const dob = new Date(data.dateOfBirth);
            const today = new Date();
            if (dob >= today) {
                errors.push('Date of birth must be in the past');
            }
        }

        return errors;
    }

    async processAutoVerification(verificationId) {
        try {

            console.log('Processing auto verification for:', verificationId);

            const verification = await this.verificationRepository.findById(verificationId);
            if (!verification) {
                throw new Error('Verification not found');
            }

            // Update status to processing
            await this.verificationRepository.updateStatus(verificationId, 'processing');

            // Process with AI agent
            const aiResult = await this.aiAgentService.processVerification(
                verificationId,
                verification.certificateFile,
                verification.consentFile
            );

            // Determine final status based on AI confidence
            let finalStatus;
            if (aiResult.confidenceScore >= 0.85) {
                finalStatus = 'completed';
            } else if (aiResult.confidenceScore >= 0.60) {
                finalStatus = 'requires_review';
            } else {
                finalStatus = 'failed';
            }

            // Update verification with AI results
            await this.verificationRepository.updateStatus(
                verificationId,
                finalStatus,
                aiResult
            );

            console.log('Auto verification completed with status:', finalStatus);

        } catch (error) {
            // If AI processing fails, mark as requires_review
            await this.verificationRepository.updateStatus(
                verificationId,
                'requires_review',
                JSON.stringify({ error: error.message })
            );
        }
    }

    async assignForManualVerification(verificationData, user, institution) {
        console.log('Assigning for manual verification:', verificationData.id);
        // In a real system, this would assign to an available employee
        // For now, we'll just mark it as pending_assignment
        await this.verificationRepository.updateStatus(
            verificationData.id,
            'pending_assignment'
        );

        // notify user 
        console.log(`Verification ${verificationData.id} has been saved successfully`);
        this.emailService.sendVerificationRequestEmail(verificationData, user, institution) 

        // TODO: Notify admin team about new verification request
        console.log(`Verification ${verificationData.id} requires manual assignment`);
    }
}

module.exports = StartVerification; 