const { user } = require("pg/lib/defaults");
const User = require('../../entities/User');

class RegisterMember {
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
        if (!validCountries.includes(user.country)) {
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
        user.password = await this.hashService.hash("teammember");

        // Create user
        const createdUser = await this.userRepository.create(user);

        // Send verification email
        await this.emailService.sendVerificationEmail(user.email, createdUser.id);

        return createdUser.toJSON();
    }
}

module.exports = RegisterMember;