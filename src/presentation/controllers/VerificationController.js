
class VerificationController {
    constructor(
        startVerificationUseCase,
        getUserVerificationsUseCase,
        geVerificationByIdUseCase,
        getInstitutionsUseCase,
        getInstitutionResponseByVerificationIdUseCase,
        getWalletBalanceUseCase
    ) {
        this.startVerifications = startVerificationUseCase;
        this.getUserVerifications = getUserVerificationsUseCase;
        this.getVerificationById = geVerificationByIdUseCase;
        this.getInstitutions = getInstitutionsUseCase;
        this.getInstitutionResponseByVerificationId = getInstitutionResponseByVerificationIdUseCase;
        this.getWalletBalance = getWalletBalanceUseCase;
    }

    /**
     * Save verification request details with a status 'pending_assignment' in DB and 
     * indicates the type of processing and priority of the request. 
     * @param {*} req 
     * @param {*} res 
     * @returns a json object containing success, message and data (saved verification request) 
     * properties.
     */
    async startVerification(req, res) {
        try {
            console.log('Starting verification with data:', {
                body: req.body,
                files: req.files,
                user: req.user
            });

            // Extract data from request
            const {
                institutionId,
                firstName,
                lastName,
                maidenName,
                dateOfBirth,
                courseName,
                degreeType,
                classification,
                graduationYear,
                studentId,
                additionalNotes,
                consentAgreement
            } = req.body;

            // Check if files exist
            if (!req.files || !req.files.certificate || !req.files.consentForm) {
                throw new Error('Both certificate and consent form files are required');
            }

            const certificateFile = req.files.certificate[0];
            const consentFile = req.files.consentForm[0];

            console.log('Certificate file:', {
                originalname: certificateFile.originalname,
                path: certificateFile.path,
                size: certificateFile.size
            });

            console.log('Consent file:', {
                originalname: consentFile.originalname,
                path: consentFile.path,
                size: consentFile.size
            });

            // Prepare verification data
            const verificationData = {
                userId: req.user.id,
                institutionId,
                firstName,
                lastName,
                maidenName,
                dateOfBirth,
                courseName,
                degreeType,
                classification,
                graduationYear,
                studentId,
                additionalNotes,
                consentAgreement: consentAgreement === 'on'
            };

            // Execute verification use case
            const verification = await this.startVerifications.execute(
                verificationData,
                req.user,
                {
                    certificate: certificateFile,
                    consentForm: consentFile
                }
            );

            console.log('Verification started successfully:', verification.referenceNumber);

            // Handle response based on request type
            if (req.accepts('html')) {
                req.session.flash = {
                    message: `Verification started successfully! Reference: ${verification.referenceNumber}`,
                    type: 'success'
                };
                return res.redirect('/verification/verification-viewall'); // Or wherever you want to redirect
            }

            res.json({
                success: true,
                message: 'Verification started successfully',
                data: verification
            });
        } catch (error) {
            console.error('Verification error:', error);

            if (req.accepts('html')) {
                req.session.flash = {
                    message: error.message,
                    type: 'error'
                };

                // Store form data for repopulation
                req.session.formData = req.body;

                // FIX: Use req.get('Referrer') instead of 'back'
                const referrer = req.get('Referrer') || '/verification/start';
                return res.redirect(referrer);
            }

            res.status(400).json({
                success: false,
                message: error.message
            });

        }
    }

    /**
     * Get all verifications request placed by a user
     * @param {*} req 
     * @param {*} res 
     * @returns a json object containing success and data (array of requests) 
     */    
    async getAllUserVerifications(req, res) {
        try {
            const { status } = req.query;

            const userId = req.user.id;

            const verifications = await this.getUserVerifications.execute(userId, status);
            console.log(verifications);
            return res.status(200).json({
                verifications: verifications
            });
        } catch (error) {
            console.log(error.message)
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Render methods
    async showViewAllUserVerificationsForm(req, res) {
        try {

            const user = req.user;

            // For HTML requests, render the welcome page
            return res.render('verification/verifications-viewall', {
                title: 'All Verifications',
                user: user,
            });

        } catch (error) {
            console.error('[VerificationController] Error processing response:', error);
            // Set success flash message
            res.locals.flash.set('Error Loading verification data.Retry', 'error');
            const referrer = req.get('Referrer');
            return res.redirect(referrer);
        }
    }

    // Or use a more robust parsing function
    parseDataPoints(data) {
        const result = { ...data };

        // Parse each field that looks like JSON
        for (const key in result) {
            if (result[key] && typeof result[key] === 'string') {
                const value = result[key].trim();

                // Check if it looks like JSON (starts with { or [)
                if ((value.startsWith('{') && value.endsWith('}')) ||
                    (value.startsWith('[') && value.endsWith(']'))) {

                    try {
                        // First, try to parse as valid JSON
                        result[key] = JSON.parse(value);
                    } catch (e) {
                        try {
                            // If it's invalid JSON (like {match:true,confidence:95}), fix it
                            // Add quotes around unquoted property names
                            const fixedValue = value
                                .replace(/([{,])\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
                                .replace(/:\s*'([^']*)'/g, ':"$1"');

                            result[key] = JSON.parse(fixedValue);
                        } catch (e2) {
                            console.warn(`Failed to parse ${key} as JSON:`, value);
                            // Keep as string if parsing fails
                        }
                    }
                }
            }
        }

        return result;
    }

    async showVerificationDetails(req, res) {
        try {

            const { id } = req.params;

            const userId = req.user.id

            const data = await this.getVerificationById.execute(userId, id);
           
            res.render('verification/verification-details', {
                title: 'Verifications - Details',
                user: req.user,
                data: data 
            });
        } catch (error) {
            console.error('[VerificationResponseController] Error processing response:', error);
            const referrer = req.get('Referrer') || '/api/institutions-page';
            return res.redirect(referrer);
        }

    }

    async showVerificationForm(req, res) {
        try {

            const institutionId = req.query.institutionId;

            if (!institutionId) {
                return res.redirect('/api/institutions-page');
            }

            const institution = await this.getInstitutions.execute(institutionId);

            if (!institution) {
                return res.redirect('/api/institutions-page');
            }

            const balance = await this.getWalletBalance.execute(req.user.id);

            if (balance.balance < institution.vfee || balance < process.env.MIN_WALLET_BALANCE) {
                res.locals.flash.set("Insufficient funds or low minimum balance", 'info');
                return res.redirect('/payments/add-funds');
            }

            // Pass formData for repopulation if there was an error
            const formData = req.session.formData || {};

            // Clear formData from session after using it
            if (req.session.formData) {
                delete req.session.formData;
            }

            res.render('verification/verification-form', {
                title: 'New Verification - AcademicVerify',
                user: req.user,
                institution: institution,
                formData: formData,
                currentDate: new Date().toISOString().split('T')[0],
                currentYear: new Date().getFullYear()
            });

        } catch (error) {
            // FIX: Use req.get('Referrer') instead of 'back'
            console.log(error.message);
            const referrer = req.get('Referrer') || '/api/institutions-page';
            return res.redirect(referrer);
        }
    }
}

module.exports = VerificationController;