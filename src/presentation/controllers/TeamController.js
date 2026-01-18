class TeamController {
    constructor(
        inviteTeamMemberUseCase,
        getTeamMembersUseCase,
        activateTeamMemberUseCase,
        registerMemberUseCase, 
        removeMemberUseCase, 
        resendVerificationEmailUseCase
    ) {
        this.inviteTeamMember = inviteTeamMemberUseCase;
        this.getTeamMembers = getTeamMembersUseCase;
        this.activateTeamMember = activateTeamMemberUseCase;
        this.registerTeamMember = registerMemberUseCase;
        this.removeTeamMember = removeMemberUseCase;
        this.resendVerificationEmail = resendVerificationEmailUseCase;
    }

    async inviteMember(req, res) {
        try {
            const { email, firstName, surname } = req.body;
            const userData = req.user;
          
            delete userData.id;
            delete userData.lastLogin;
            delete userData.createdAt;
            delete userData.updatedAt;

            userData.firstName = firstName;
            userData.surname = surname;
            userData.email = email;
            userData.role = 'member';
            userData.password = 'member'; 
            userData.isVerified = false;
           
            const result = await this.inviteTeamMember.execute(userData);
            
            res.json({
                success: true,
                message: 'Invitation sent successfully',
                data: result
            });
        } catch (error) {
            console.error('Registration error:', error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async resendInvitation(req, res) {
        try {
            const { email } = req.params;
         
            if (!email) {
                throw new Error('Email address is required');
            }

            // Generate a new verification token
            await this.resendVerificationEmail.execute(email);

            // For API requests, return JSON response
            res.status(201).json({
                success: true
            });

        } catch (error) {
            console.error('Resend verification error:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async getMembers(req, res) {
        try {

            const user = req.user;

            console.log(user);
            
            const members = await this.getTeamMembers.execute(user.companyName);
      
            res.status(200).json({
                success: true,
                data: members
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async activateMember(req, res) {
        try {
            const { id } = req.params;

            const user = await this.activateTeamMember.execute(id);

            // For HTML requests, render the welcome page
            if (req.accepts('html')) {
                return res.render('auth/welcome', {
                    title: 'Welcome to Hakika!',
                    data: user,
                    success: true
                });
            }

            res.json({
                success: true,
                message: 'Team member activated successfully',
                data: user
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async removeMember(req, res) {
        try {
            const { id } = req.params;

            const result = await this.removeTeamMember.execute(id);

            res.json({
                success: true,
                message: 'Team member delete successfully'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Render methods
    showTeam(req, res) {
        res.render('dashboard/team', {
            title: 'Team Management - AcademicVerify',
            user: req.session.user
        });
    }
}

module.exports = TeamController;