const TeamMember = require('../../entities/TeamMember');
const User = require('../../entities/User');

class InviteTeamMember {
    // constructor( teamMemberRepository, userRepository, emailService) {
    //     this.teamMemberRepository = teamMemberRepository;
    //     this.userRepository = userRepository;
    //     this.emailService = emailService;
    // }
    constructor(userRepository, emailService, hashService, configurationService) {
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.hashService = hashService;
        this.configurationService = configurationService;
    }
 async execute(userData) {
        // Validate user data
        const user = new User(userData);
        
        const validationErrors = user.validate();
    
        if (validationErrors.length > 0) {
            throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
        }

        // Validate country against configuration
        const validCountries = await this.configurationService.getCountries();
        const validCountriesNameValues = validCountries.map(country => country.name);
        if (!validCountriesNameValues.includes(user.country)) {
            throw new Error('Invalid country selected');
        }

        // Validate company type against configuration
        const validCompanyTypes = await this.configurationService.getCompanyTypes();
        const validCompanyTypeValues = validCompanyTypes.map(type => type.value);
        if (!validCompanyTypeValues.includes(user.companyType)) {
            throw new Error('Invalid company type selected');
        }

        // Check if user already exists
        const existingUser = await this.userRepository.findByEmail(user.email);
        if (existingUser) {
            throw new Error('User with this email already exists');
        }

        // Hash password
        user.password = await this.hashService.hash(userData.password);
        
        // Create user
        const createdUser = await this.userRepository.create(user);

        // Send verification email
        await this.emailService.sendTeamInvitation(userData.email, createdUser.id);

        return createdUser.toJSON();
    }
    // async execute(teamId, inviterUserId, email, role, permissions) {
    //     // Check if user already exists
    //     const existingUser = await this.userRepository.findByEmail(email);

    //     // Check if already invited
    //     const existingInvite = await this.teamMemberRepository.findByEmailAndTeamId(email, teamId);
    //     if (existingInvite) {
    //         throw new Error('User already invited to this team');
    //     }

    //     const teamMember = new TeamMember({
    //         teamId,
    //         userId: existingUser ? existingUser.id : null,
    //         email,
    //         role,
    //         permissions,
    //         invitedAt: new Date()
    //     });

    //     const validationErrors = teamMember.validate();
    //     if (validationErrors.length > 0) {
    //         throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    //     }

    //     // Create team member invitation
    //     const invitedMember = await this.teamMemberRepository.create(teamMember);

    //     // Send invitation email
    //     await this.emailService.sendTeamInvitation(email, teamId, inviterUserId, role);

    //     return invitedMember.toJSON();
    // }
}

module.exports = InviteTeamMember;