const DashboardUtility = require('../../../domain/utils/DashboardUtility');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

class AdminController {
    constructor(loginAdminUsecase,
        dashboardUsecase,
        configurationService,
        getinstituitionsUsecase,
        passwordResetService,
        getInstitutionService) {
        this.configurationService = configurationService;
        this.getinstituitionsUsecase = getinstituitionsUsecase;
        this.dashboardUseCase = dashboardUsecase;
        this.loginAdminUsecase = loginAdminUsecase;
        this.passwordResetService = passwordResetService
        this.institutionService = getInstitutionService;
            this.dashboardUtility = new DashboardUtility();
    }

    async showDashboard(req, res) {
        let user;
        try {

            user = req.session.user;
            
            const data = await this.dashboardUtility.getDashboardData(user.id, this.dashboardUseCase);

            return res.render('admin/dashboard', {
                title: 'Admin Dashboard - AcademicVerify',
                user: user,
                layout: 'admin',
                totalInstitutions: (await this.configurationService.getInstitutions()).length, // Replace with actual data
                countriesCount: (await this.configurationService.getCountries()).length,   // Replace with actual data
                autoVerificationCount: data.dashboardData.autoVerificationsCount, // Replace with actual data
                pendingTasks: data.dashboardData.pendingCount        // Replace with actual data
            });

        } catch (error) {

            console.error(`[DashboardController] Error getting dashboard data for user ${user.id}:`, error);
            res.render('admin/dashboard', {
                title: 'Reg - AcademicVerify',
                countries: [],
                companyTypes: [],
                formData: {},
                errors: []
            });

        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;

            const user = await this.loginAdminUsecase.execute(email, password);
            console.log(user);
            req.session.user = user;

            return res.status(200).json({
                success: true,
                user: user,
                email
            });


        } catch (error) {
            res.status(401).json({
                success: false,
                message: error.message
            });
        }
    }

    async getCountries(req, res) {
        try {

            const countries = await this.configurationService.getCountries();

            res.json({
                success: true,
                data: countries
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async getCompanyTypes(req, res) {
        try {
            const companyTypes = await this.configurationService.getCompanyTypes();

            res.json({
                success: true,
                data: companyTypes
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async getInstitutions(req, res) {
        try {
            const institutions = await this.getInstitutionServiceService.getInstitutions();

            res.json({
                success: true,
                data: institutions
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async updateCountries(req, res) {
        try {
            const { countries } = req.body;

            if (!Array.isArray(countries)) {
                throw new Error('Countries must be an array');
            }

            const result = await this.configurationService.updateCountries(countries);

            res.json({
                success: true,
                message: 'Countries updated successfully',
                data: result.toJSON()
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async updateCompanyTypes(req, res) {
        try {
            const { companyTypes } = req.body;

            if (!Array.isArray(companyTypes)) {
                throw new Error('Company types must be an array');
            }

            const result = await this.configurationService.updateCompanyTypes(companyTypes);

            res.json({
                success: true,
                message: 'Company types updated successfully',
                data: result.toJSON()
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async getConfiguration(req, res) {
        try {
            const { key } = req.params;
            const value = await this.configurationService.getConfiguration(key);

            res.json({
                success: true,
                data: value
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async setConfiguration(req, res) {
        try {
            const { key, value, description, category } = req.body;

            if (!key || value === undefined) {
                throw new Error('Key and value are required');
            }

            const result = await this.configurationService.setConfiguration(
                key,
                value,
                description,
                category
            );

            res.json({
                success: true,
                message: 'Configuration updated successfully',
                data: result.toJSON()
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async getAllConfigurations(req, res) {
        try {
            const configurations = await this.configurationService.configurationRepository.findAllActive();

            res.json({
                success: true,
                data: configurations.map(config => config.toJSON())
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async forgotPassword(req, res) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is required'
                });
            }

            // Find user by email
            const user = await this.userService.findByEmail(email);
            if (!user) {
                // For security, don't reveal if email exists
                return res.json({
                    success: true,
                    message: 'If the email exists, a reset link has been sent'
                });
            }

            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenExpiry = Date.now() + 3600000; // 1 hour

            // Save reset token to database
            await this.passwordResetService.createResetToken(
                user.id,
                resetToken,
                resetTokenExpiry
            );

            // Send reset email
            const resetLink = `${process.env.BASE_URL}/auth/reset-password?token=${resetToken}`;
            await this.emailService.sendPasswordResetEmail(user.email, resetLink, user.firstName);

            res.json({
                success: true,
                message: 'Password reset link has been sent to your email'
            });
        } catch (error) {
            console.error('Forgot password error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to process password reset request'
            });
        }
    }

    async showResetPassword(req, res) {
        try {
            const { token } = req.query;

            if (!token) {
                return res.redirect('/auth/login?message=invalid_reset_token');
            }

            // Verify token is valid and not expired
            const resetRequest = await this.passwordResetService.validateResetToken(token);
            if (!resetRequest) {
                return res.redirect('/auth/login?message=invalid_reset_token');
            }

            res.render('auth/reset-password', {
                title: 'Reset Password - Hakika',
                token: token,
                layout: 'layouts/auth'
            });
        } catch (error) {
            console.error('Show reset password error:', error);
            res.redirect('/auth/login?message=reset_error');
        }
    }

    async resetPassword(req, res) {
        try {
            const { token, password, confirmPassword } = req.body;

            if (!token || !password || !confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'All fields are required'
                });
            }

            if (password !== confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Passwords do not match'
                });
            }

            if (password.length < 8) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must be at least 8 characters long'
                });
            }

            // Validate reset token
            const resetRequest = await this.passwordResetService.validateResetToken(token);
            if (!resetRequest) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or expired reset token'
                });
            }

            // Update user's password
            await this.userService.updatePassword(resetRequest.userId, password);

            // Mark reset token as used
            await this.passwordResetService.markTokenAsUsed(token);

            // Send confirmation email
            const user = await this.userService.findById(resetRequest.userId);
            await this.emailService.sendPasswordChangedEmail(user.email, user.firstName);

            res.json({
                success: true,
                message: 'Password has been reset successfully'
            });
        } catch (error) {
            console.error('Reset password error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to reset password'
            });
        }
    }

        async assignForProcessing(req, res) {
        try {
            const { verificationId, institutionId, connectionType } = req.body;
            const assignedBy = req.user.id;

            const response = await this.useCases.createInstitutionResponse.execute({
                verificationId,
                institutionId,
                responseType: connectionType === 'api' ? 'api_manual' : 'manual',
                assignedBy
            });

            res.status(201).json({
                success: true,
                data: response,
                message: `Verification assigned for ${connectionType} processing`
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    // Render methods
    showForgotPassword(req, res) {
        res.render('admin/forgot-password', {
            title: 'Forgot Password - Hakika',
            layout: 'layouts/auth'
        });
    }

    // Admin views
    showAdminLogin(req, res) {
        res.render('admin/login', {
            title: 'Admin Login',
            layout: 'admin',
        });
    }

    // Admin views
    showConfigurationManagement(req, res) {
        res.render('admin/configuration', {
            title: 'System Configuration - AcademicVerify',
            user: req.session.user,
            layout: 'admin',
        });
    }

    showInstitutionManagement(req, res) {
        res.render('admin/institutions', {
            title: 'Institutions - AcademicVerify',
            user: req.session.user,
            layout: 'admin',
        });
    }

    showCountriesManagement(req, res) {
        res.render('admin/countries', {
            title: 'Countries Management - AcademicVerify',
            user: req.session.user,
            layout: 'admin'
        });
    }

    showCompanyTypesManagement(req, res) {
        res.render('admin/company-types', {
            title: 'Company Types Management - AcademicVerify',
            user: req.session.user,
            layout: 'admin',
        });
    }
}

module.exports = AdminController;