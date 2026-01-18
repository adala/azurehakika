class SystemAuthController {
    constructor(loginSystemUseCase, changePasswordUseCase, getProfileUseCase, updateProfileUseCase) {
        this.loginSystem = loginSystemUseCase;
        this.changePasswordUseCase = changePasswordUseCase;
        this.getProfileUseCase = getProfileUseCase;
        this.updateProfileUseCase = updateProfileUseCase;
    }

    async login(req, res) {
        try {
            const { username, password } = req.body;

            const user = await this.loginSystem.execute(username, password);

            // Store user in session
            req.session.user = {
                id: user.id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                department: user.department,
                mustChangePassword: user.mustChangePassword
            };

            // Redirect based on role or password change requirement
            if (user.mustChangePassword) {
                return res.json({
                    success: true,
                    redirect: '/system/change-password'
                });
            }
            
            const redirect = user.role === 'admin' ? '/system/dashboard/admin' : user.role === 'supervisor' ? '/system/dashboard/supervisor' : '/system/dashboard/worker'
            return res.json({
                success: true,
                redirect: redirect
            });

        } catch (error) {
            res.status(401).json({
                success: false,
                message: error.message
            });
        }
    }

    async logout(req, res) {
        req.session.destroy((err) => {
            if (err) {
                console.error('Logout error:', err);
            }
            res.redirect('/system/login');
        });
    }

    async showLogin(req, res) {
        if (req.session.user) {
            return res.redirect('/system/dashboard');
        }
        res.render('system/login', {
            title: 'System Login - Hakika',
            layout: 'system'
        });
    }

    async showChangePassword(req, res) {
        if (!req.session.user) {
            return res.redirect('/system/login');
        }

        if (!req.session.user.mustChangePassword) {
            return res.redirect('/system/dashboard');
        }

        res.render('system/auth/change-password', {
            title: 'Change Password',
            user: req.session.user,
            layout: 'system'
        });
    }

    async changePassword(req, res) {
        try {
            const userId = req.session.user.id;
            const { currentPassword, newPassword, confirmPassword } = req.body;

            const result = await this.changePasswordUseCase.execute(
                userId,
                currentPassword,
                newPassword,
                confirmPassword
            );

            // Update session
            req.session.user.mustChangePassword = false;

            res.json({
                success: true,
                message: result.message,
                redirect: '/system/dashboard'
            });

        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async getProfile(req, res) {
        try {
            const userId = req.session.user.id;
            const user = await this.getProfileUseCase.execute(userId);

            res.render('system/auth/profile', {
                title: 'My Profile',
                user: req.session.user,
                layout: 'system',
                userDetails: user
            });
        } catch (error) {
            res.status(500).render('error', {
                message: 'Failed to load profile',
                error: error.message
            });
        }
    }

    async updateProfile(req, res) {
        try {
            const userId = req.session.user.id;
            const { firstName, lastName, email } = req.body;

            await this.updateProfileUseCase.update(userId, {
                firstName,
                lastName,
                email
            });

            // Update session
            req.session.user.firstName = firstName;
            req.session.user.lastName = lastName;
            req.session.user.email = email;

            res.json({
                success: true,
                message: 'Profile updated successfully'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = SystemAuthController;