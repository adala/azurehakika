class AuthController {
    constructor(
        registerUserUseCase,
        loginUserUseCase,
        verifyOTPUseCase,
        verifyEmailUseCase,
        configurationService,
        emailService,
        resendVerificationEmailUseCase,
        updateUserEmailUseCase,
        updateUserPasswordUseCase) {
        this.registerUser = registerUserUseCase;
        this.loginUser = loginUserUseCase;
        this.verifyOTPs = verifyOTPUseCase;
        this.verifyEmails = verifyEmailUseCase;
        this.configurationService = configurationService;
        this.emailService = emailService;
        this.resendVerificationEmail = resendVerificationEmailUseCase;
        this.updateUserEmail = updateUserEmailUseCase;
        this.updateUserPassword = updateUserPasswordUseCase;
    }

    async register(req, res) {
        try {
            const userData = req.body;
        
            // Validate required fields
            const requiredFields = ['firstName', 'surname', 'email', 'password', 'companyName', 'companyType', 'country'];
            const missingFields = requiredFields.filter(field => !userData[field]);

            if (missingFields.length > 0) {
                throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
            }

            // Validate password confirmation
            if (userData.password !== userData.confirmPassword) {
                throw new Error('Passwords do not match');
            }

            // Validate terms agreement
            if (!userData.terms) {
                throw new Error('You must agree to the terms and conditions');
            }

            const user = await this.registerUser.execute(userData);

            // For HTML requests, render the welcome page
            if (req.accepts('html')) {
                return res.render('auth/welcome', {
                    title: 'Welcome to Hakika!',
                    data: user,
                    success: true
                });
            }

            // For API requests, return JSON response
            res.status(201).json({
                success: true,
                message: 'Registration successful. Please check your email for verification.',
                data: user
            });
        } catch (error) {
            console.error('Registration error:', error.message);
            // For HTML requests, return to registration form with errors
            if (req.accepts('html')) {

                try {
                    const [countries, companyTypes] = await Promise.all([
                        this.configurationService.getCountries(),
                        this.configurationService.getCompanyTypes()
                    ]);

                    return res.render('auth/register', {
                        title: 'Register - Hakika',
                        countries: countries || [],
                        companyTypes: companyTypes || [],
                        formData: req.body
                    });
                } catch (configError) {
                    console.error('Error loading configuration:', configError);
                    return res.render('auth/register', {
                        title: 'Register - Hakika',
                        countries: [],
                        companyTypes: [],
                        formData: req.body,
                        errors: [error.message]
                    });
                }
            }
            res.status(400).json({
                success: false,
                errors: error.message
            });
        }
    }

    async verifyEmail(req, res) {
        try {
            const { userId } = req.params;
            const result = await this.verifyEmails.execute(userId);

            // Set success flash message
            //res.locals.flash.set('Email verified successfully! You can now log in.', 'success');

            // Render success page
            res.render('auth/email-verified', {
                title: 'Email Verified',
                message: result.message
            });
        } catch (error) {
            // Set error flash message
            res.locals.flash.set(error.message, 'error');

            res.render('auth/email-verification-failed', {
                title: 'Verification Failed',
                errors: [error.message]
            });
        }
    }

    // Add resend verification email endpoint
    async resendVerification(req, res) {
        try {
            const { email } = req.body;

            if (!email) {
                throw new Error('Email address is required');
            }

            // Generate a new verification token
            const user = await this.resendVerificationEmail.execute(email);

            // For HTML requests, render the welcome page
            if (req.accepts('html')) {
                return res.render('auth/welcome', {
                    title: 'Welcome to Hakika!',
                    data: user,
                    success: true
                });
            }

            // For API requests, return JSON response
            res.status(201).json({
                success: true,
                message: 'Verification Email resent successful. Please check your email.',
                data: user
            });

        } catch (error) {
            console.error('Resend verification error:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }


    async login(req, res) {
        try {
            const { email } = req.body;


            const result = await this.loginUser.execute(email);

            // Set success flash message for OTP
            // if (result.requiresOTP) {
            //     res.locals.flash.set(result.message, 'info');
            // }

            return res.status(200).json({
                title: 'Enter Verification Code',
                success: true,
                ...result,
                email
            });


        } catch (error) {

            console.error(error.message);
            res.status(401).json({
                success: false,
                message: error.message
            });
        }
    }

    async verifyOTP(req, res) {
        try {
            const { email, otp } = req.body;

            const result = await this.verifyOTPs.execute(email, otp);

            // CRITICAL FIX: Set token in BOTH cookie AND session for cluster compatibility
            // Cookie is accessible across all workers
            res.cookie('token', result.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax', // Changed from 'strict' to 'lax' for better navigation support
                maxAge: 24 * 60 * 60 * 1000 // 24 hours
            });

            // Set success flash message
            //res.locals.flash.set('Login successful! Welcome back.', 'success');
            // Store in session as well (requires session store for cluster)
            req.session.user = result.user;
            req.session.token = result.token;
            req.user = result.user;

            console.log(`Worker ${process.pid}: User logged in:`, result.user.email);
            console.log(`Worker ${process.pid}: Token set in cookie and session`);

            // CRITICAL: Force session save before responding
            req.session.save((err) => {
                if (err) {
                    console.error(`Worker ${process.pid}: Session save error:`, err);
                    return res.status(500).json({
                        success: false,
                        error: 'Session error'
                    });
                }

                console.log(`Worker ${process.pid}: Session saved successfully`);

                res.json({
                    success: true,
                    token: result.token,
                    message: 'Login successful! Welcome back.',
                    data: result
                });
            });
        } catch (error) {

            // Set error flash message
            if (req.accepts('html')) {
                res.locals.flash.set(error.message, 'error');
                return res.render('auth/otp', {
                    title: 'Enter OTP - Hakika',
                    email: req.body.email,
                    errors: [error.message]
                });
            }

            res.status(401).json({
                success: false,
                message: error.message
            });
        }
    }

    // In your AuthController or UserController
    async updateEmail(req, res) {
        try {
            const { newEmail, confirmPassword } = req.body;
            const userId = req.session.user.id;

            // Update email
            const result = await this.updateUserEmail.execute(userId, newEmail, confirmPassword);

            res.json({
                success: true,
                data: result,
                newEmail: newEmail
            });
        } catch (error) {
            console.log(error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async updatePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;
            const userId = req.session.user.id;

            // Update password
            await this.updateUserPassword.execute(userId, currentPassword, newPassword);

            res.json({
                success: true,
                message: 'Password updated successfully. You will be logged out for security.'
            });
        } catch (error) {
            console.log(error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Render methods for views
    async showRegisterForm(req, res) {
        try {
            const [countries, companyTypes] = await Promise.all([
                this.configurationService.getCountries(),
                this.configurationService.getCompanyTypes()
            ]);
            res.render('auth/register', {
                title: 'Register - Hakika',
                countries: countries,
                companyTypes: companyTypes
            });
        } catch (error) {
            console.error('Error loading configuration for registration:', error);

            // Fallback to empty arrays to prevent template errors
            res.render('auth/register', {
                title: 'Register - Hakika',
                countries: [],
                companyTypes: [],
                formData: {},
                errors: []
            });
        }
    }

    showLoginForm(req, res) {
        res.render('auth/login', {
            title: 'Login - Hakika'
        });
    }

    showWelcomePage(req, res) {
        res.render('auth/welcome', {
            title: 'Welcome - Hakika'
        });
    }

    showOTPForm(req, res) {
        res.render('auth/otp', {
            title: 'Enter OTP - Hakika',
            email: req.query.email
        });
    }

    async logout(req, res) {

        console.log(`Worker ${process.pid}: User logging out`);
        
        // Set logout success message
        res.locals.flash.set('You have been logged out successfully.', 'info');

        // Clear ALL cookies (including our custom token cookie)
        res.clearCookie('token');
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        res.clearCookie('verification.sid');
        res.clearCookie('hakika.sid'); // Clear custom session cookie
        res.clearCookie('connect.sid'); // Clear default session cookie
        
        // Clear session
        req.session.destroy((err) => {
            if (err) {
                console.error(`Worker ${process.pid}: Session destroy error:`, err);
                return res.redirect('/dashboard');
            }
            console.log(`Worker ${process.pid}: Session destroyed successfully`);
            res.redirect('/');
        });
    }
}

module.exports = AuthController;