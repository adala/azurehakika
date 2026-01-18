// REPOSITORIES
const UserRepository = require('../infrastructure/repositories/UserRepository');
const SystemUserRepository = require('../infrastructure/repositories/SystemUserRepository')
const InstitutionRepository = require('../infrastructure/repositories/InstitutionRepository');
const InstitutionResponseRepository = require('../infrastructure/repositories/InstitutionResponseRepository');
const AssignmentRepository = require('../infrastructure/repositories/AssignmentRepository');
const ApiConfigRepository = require('../infrastructure/repositories/ApiConfigRepository');
const ApiClient = require('../infrastructure/external/ApiClient');
const ResponseParser = require('../infrastructure/external/ResponseParser');
const VerificationRepository = require('../infrastructure/repositories/VerificationRepository');
const WalletRepository = require('../infrastructure/repositories/WalletRepository');
const TeamMemberRepository = require('../infrastructure/repositories/TeamMemberRepository');
const TransactionRepository = require('../infrastructure/repositories/TransactionRepository');
const AnalyticsRepository = require('../infrastructure/repositories/AnalyticsRepository');
const BulkVerificationRepository = require('../infrastructure/repositories/BulkVerificationRepository');
const ConfigurationRepository = require('../infrastructure/repositories/ConfigurationRepository');

// SERVICES
const EmailService = require('../infrastructure/email/EmailService');
const HashService = require('../infrastructure/auth/HashService');
const JWTService = require('../infrastructure/auth/JWTService');
const SessionService = require('../infrastructure/auth/SessionService');
const FileService = require('../domain/services/FileService');
const MomoPaymentService = require('../infrastructure/payment/TestMomoPaymentService');
const CardPaymentService = require('../infrastructure/payment/TestCardPaymentService');
const AIAgentService = require('../infrastructure/ai/AIAgentService');
const PDFService = require('../domain/services/PDFService');
const ConfigurationService = require('../domain/services/ConfigurationService')
const PaystackService = require('../infrastructure/payment/PaystackService.js');

// USECASES
// Auth
const RegisterUser = require('../domain/usecases/auth/RegisterUser');
const LoginUser = require('../domain/usecases/auth/LoginUser');
const VerifyOTP = require('../domain/usecases/auth/VerifyOTP');
const VerifyEmail = require('../domain/usecases/auth/VerifyEmail');
const UpdateUserEmail = require('../domain/usecases/users/UpdateUserEmail');
const UpdateUserPassword = require('../domain/usecases/users/UpdateUserPassword');
const StartVerification = require('../domain/usecases/verification/StartVerification');
const GetUserVerifications = require('../domain/usecases/verification/GetUserVerifications');
const GetInstitutions = require('../domain/usecases/system/institution/GetInstitutions');
const GetInstitutionByCode = require('../domain/usecases/system/institution/GetInstitutionByCode');
const GetInstitutionById = require('../domain/usecases/system/institution/GetInstitutionById');
const GetInstiutionResponseByVerificationId = require('../domain/usecases/verification/GetInstiutionResponseByVerificationId');
const GetVerificationById = require('../domain/usecases/verification/GetVerificationById');
const CreateInstitution = require('../domain/usecases/system/institution/CreateInstitution');
const UpdateInstitution = require('../domain/usecases/system/institution/UpdateInstitution');
const InstitutionService = require('../domain/services/InstitutionService');
const GetWalletBalance = require('../domain/usecases/money/GetWalletBalance');
const AddFunds = require('../domain/usecases/money/AddFunds');
const DeleteTransaction = require('../domain/usecases/money/DeleteTransaction.js');
const InviteTeamMember = require('../domain/usecases/users/InviteTeamMember');
const GetTeamMembers = require('../domain/usecases/users/GetTeamMembers');
const ActivateTeamMember = require('../domain/usecases/users/ActivateTeamMember');
const RemoveTeamMember = require('../domain/usecases/users/RemoveTeamMember');
const ResendVerificationEmail = require('../domain/usecases/ResendVerificationEmail');
const ProcessVerificationWithAI = require('../domain/usecases/verification/ProcessVerificationWithAI');
const GetTransactions = require('../domain/usecases/money/GetTransactions');
const GetUserAnalytics = require('../domain/usecases/GetUserAnalytics');

//System
const GetAdminStats = require('../domain/usecases/system/GetAdminStats');
const GetAssigneeTasks = require('../domain/usecases/system/GetAssigneeTasks');
const ProcessApiVerification = require('../domain/usecases/system/ProcessApiVerification');
const ProcessManualVerification = require('../domain/usecases/system/ProcessManualVerification');
const LoginAdmin = require('../domain/usecases/system/users/LoginAdmin');
const LoginSystem = require('../domain/usecases/system/users/LoginSystem');
const GetProfile = require('../domain/usecases/system/users/GetProfile');
const UpdateProfile = require('../domain/usecases/system/users/UpdateProfile');
const ChangePassword = require('../domain/usecases/system/users/ChangePassword.js');
const DashboardStats = require('../domain/usecases/system/DashboardStats.js')


const ProcessBulkVerification = require('../domain/usecases/verification/ProcessBulkVerification');
const GetBulkVerifications = require('../domain/usecases/verification/GetBulkVerifications');
const GetTransactionStats = require('../domain/usecases/money/GetTransactionStats');
const GetBulkStats = require('../domain/usecases/GetBulkStats');
const GetDasboardData = require('../domain/usecases/GetDashboardData');
const GetCountries = require('../domain/usecases/system/GetCountries');

// CONTROLLERS
const AuthController = require('../presentation/controllers/AuthController');

// System
const SystemManagementController = require('../presentation/controllers/system/SystemManagementController');
const SytemAuthController = require('../presentation/controllers/system/SystemAuthController.js');

const VerificationController = require('../presentation/controllers/VerificationController');
const TransactionController = require('../presentation/controllers/TransactionController');
const AnalyticsController = require('../presentation/controllers/system/AnalyticsController');
const BulkVerificationController = require('../presentation/controllers/BulkVerificationController');
const ReportController = require('../presentation/controllers/ReportController');
const PaymentController = require('../presentation/controllers/PaymentController');
const TeamController = require('../presentation/controllers/TeamController');
const AdminController = require('../presentation/controllers/system/AdminController');
const AssigneeController = require('../presentation/controllers/system/AssigneeController');
const DashboardController = require('../presentation/controllers/DashboardController');
const InstitutionController = require('../presentation/controllers/InstitutionController');


class DIContainer {
    constructor() {
        this.services = {};
        this.initializeServices();
    }

    initializeServices() {

        // repositories
        this.services.userRepository = new UserRepository();
        this.services.systemUserRepository = new SystemUserRepository();
        this.services.analyticsRepository = new AnalyticsRepository();
        this.services.bulkVerificationRepository = new BulkVerificationRepository();
        this.services.analyticsRepository = new AnalyticsRepository();
        this.services.bulkVerificationRepository = new BulkVerificationRepository();
        this.services.institutionRepository = new InstitutionRepository();
        this.services.institutionResponseRepository = new InstitutionResponseRepository();
        this.services.verificationRepository = new VerificationRepository();
        this.services.walletRepository = new WalletRepository();
        this.services.transactionRepository = new TransactionRepository();
        this.services.teamMemberRepository = new TeamMemberRepository();
        this.services.configurationRepository = new ConfigurationRepository();
        this.services.assignmentRepository = new AssignmentRepository();
        this.services.apiConfigRepository = new ApiConfigRepository();

        // services
        this.services.emailService = new EmailService();
        this.services.hashService = new HashService();
        this.services.jwtService = new JWTService();
        this.services.sessionService = new SessionService();
        this.services.fileService = new FileService();
        this.services.pdfService = new PDFService();
        this.services.momoPaymentService = new MomoPaymentService();
        this.services.cardPaymentService = new CardPaymentService();
        this.services.paystackService = new PaystackService();
        this.services.aiAgentService = new AIAgentService();
        this.services.configurationService = new ConfigurationService(
            this.services.configurationRepository
        );
        this.services.institutionService = new InstitutionService(
            this.services.getInstitutionsUseCase,
            this.services.getInstitutionByCodeUseCase,
            this.services.createInstitutionUseCase,
            this.services.updateInstitutionUseCase
        );

        // institution
        this.services.getInstitutionsUseCase = new GetInstitutions(this.services.institutionRepository);
        this.services.getInstitutionByCodeUseCase = new GetInstitutionByCode(this.services.institutionRepository);
        this.services.getInstitutionByIdUseCase = new GetInstitutionById(this.services.institutionRepository);
        this.services.getVerificationByIdUseCase = new GetVerificationById(this.services.verificationRepository);
        this.services.createInstitutionUseCase = new CreateInstitution(this.services.institutionRepository);
        this.services.updateInstitutionUseCase = new UpdateInstitution(this.services.institutionRepository);

        this.services.institutionController = new InstitutionController(
            this.services.getInstitutionsUseCase,
            this.services.configurationService
        )
        /** end of institution */

        // system
        this.services.getProfileUseCase = new GetProfile(this.services.systemUserRepository);
        this.services.updateProfileUseCase = new UpdateProfile(this.services.systemUserRepository);
        this.services.loginSystemUseCase = new LoginSystem(
            this.services.systemUserRepository,
            this.services.hashService);
        this.services.changeSystemUserPasswordUseCase = new ChangePassword(this.services.systemUserRepository);
        this.services.dashboardStatsUseCase = new DashboardStats({
            user: this.services.systemUserRepository,
            institution: this.services.institutionRepository,
            verification: this.services.verificationRepository,
            assignment: this.services.assignmentRepository,
        });
        this.services.systemManagementController = new SystemManagementController({
            dashboardStats: this.services.dashboardStatsUseCase
        });

        this.services.adminController = new AdminController(
            this.services.loginAdminUseCase,
            this.services.getDashboardDataUseCase,
            this.services.configurationService,
            this.services.getInstitutionsUseCase
        );

        this.services.sytemAuthController = new SytemAuthController(
            this.services.loginSystemUseCase,
            this.changeSystemUserPasswordUseCase,
            this.getProfileUseCase,
            this.updateProfileUseCase
        );
        /** end of system */

        // assignee
        this.services.GetAssigneeTasks = new GetAssigneeTasks(
            this.services.assignmentRepository,
            this.services.verificationRepository
        );

        this.services.assigneeController = new AssigneeController(
            this.services.GetAssigneeTasksUseCase,
            this.services.processBulkVerificationUseCase,
            this.services.procossApiVerificationUseCase
        );
        /** end of assignee */

        // auth
        this.services.registerUserUseCase = new RegisterUser(
            this.services.userRepository,
            this.services.emailService,
            this.services.hashService,
            this.services.configurationService
        );

        this.services.updateEmailUseCase = new UpdateUserEmail(
            this.services.userRepository,
            this.services.hashService,
            this.services.emailService
        );

        this.services.updatePasswordUseCase = new UpdateUserPassword(
            this.services.userRepository,
            this.services.hashService
        );

        this.services.loginUserUseCase = new LoginUser(
            this.services.userRepository,
            this.services.hashService,
            this.services.jwtService,
            this.services.emailService,
            this.services.sessionService
        );

        this.services.loginAdminUseCase = new LoginAdmin(
            this.services.userRepository,
            this.services.hashService
        );

        this.services.verifyOTPUseCase = new VerifyOTP(
            this.services.userRepository,
            this.services.jwtService,
            this.services.sessionService
        );

        this.services.verifyEmailUseCase = new VerifyEmail(
            this.services.userRepository
        );

        this.services.authController = new AuthController(
            this.services.registerUserUseCase,
            this.services.loginUserUseCase,
            this.services.verifyOTPUseCase,
            this.services.verifyEmailUseCase,
            this.services.configurationService,
            this.services.emailService,
            this.services.resendVerificationEmailUseCase,
            this.services.updateEmailUseCase,
            this.services.updatePasswordUseCase,
        );
        /** End of Auth */

        // Verifications
        this.services.startVerificationUseCase = new StartVerification(
            this.services.verificationRepository,
            this.services.institutionRepository,
            this.services.walletRepository,
            this.services.transactionRepository,
            this.services.fileService,
            this.services.aiAgentService,
            this.services.emailService
        );

        this.services.getUserVerificationsUseCase = new GetUserVerifications(
            this.services.verificationRepository
        );

        this.services.GetInstiutionResponseByVerificationIdUseCase = new GetInstiutionResponseByVerificationId(
            this.services.institutionResponseRepository
        );

        this.services.processBulkVerificationUseCase = new ProcessBulkVerification(
            this.services.bulkVerificationRepository,
            this.services.verificationRepository,
            this.services.institutionRepository,
            this.services.walletRepository,
            this.services.fileService,
            this.services.aiAgentService
        );

        this.services.getBulkVerificationsUseCase = new GetBulkVerifications(
            this.services.bulkVerificationRepository
        );

        this.services.getBulkStatsUseCase = new GetBulkStats(
            this.services.bulkVerificationRepository
        );

        this.services.getUserAnalyticsUseCase = new GetUserAnalytics(
            this.services.analyticsRepository
        );

        this.services.getAdminStatsUseCase = new GetAdminStats(
            this.services.analyticsRepository
        );

        this.services.processManualVerification = new ProcessManualVerification(
            this.services.assignmentRepository,
            this.services.verificationRepository,
            this.services.institutionResponseRepository
        );

        this.services.ProcessApiVerification = new ProcessApiVerification(
            this.services.assignmentRepository,
            this.services.verificationRepository,
            this.services.institutionResponseRepository
        );

        this.services.resendVerificationEmailUseCase = new ResendVerificationEmail(
            this.services.userRepository,
            this.services.emailService
        );

        this.services.processVerificationWithAIUseCase = new ProcessVerificationWithAI(
            this.services.verificationRepository,
            this.services.aiAgentService,
            this.services.emailService
        );

        this.services.getWalletBalanceUseCase = new GetWalletBalance(
            this.services.walletRepository
        );

        this.services.verificationController = new VerificationController(
            this.services.startVerificationUseCase,
            this.services.getUserVerificationsUseCase,
            this.services.getVerificationByIdUseCase,
            this.services.getInstitutionByIdUseCase, 
            this.services.GetInstiutionResponseByVerificationIdUseCase,
            this.services.getWalletBalanceUseCase
        );

        this.services.bulkVerificationController = new BulkVerificationController(
            this.services.processBulkVerificationUseCase,
            this.services.getBulkVerificationsUseCase,
            this.services.getBulkStatsUseCase,
            this.services.bulkVerificationRepository
        );
        /** End of verifications */

        // Dashboard
        this.services.getDashboardDataUseCase = new GetDasboardData(
            this.services.verificationRepository,
            this.services.transactionRepository,
            this.services.walletRepository,
            this.services.institutionRepository,
            this.services.teamMemberRepository,
            this.services.analyticsRepository
        );

        this.services.dashboardController = new DashboardController(
            this.services.getDashboardDataUseCase,
            this.services.configurationService,
            this.services.getInstitutionsUseCase
        );
        /** End of Dashboard */

        // Money 
        this.services.getWalletBalanceUseCase = new GetWalletBalance(
            this.services.walletRepository
        );

        this.services.getTransactionStatsUseCase = new GetTransactionStats(
            this.services.transactionRepository
        );

        this.services.getTransactionsUseCase = new GetTransactions(
            this.services.transactionRepository);

        this.services.addFundsUseCase = new AddFunds(
            this.services.walletRepository,
            this.services.transactionRepository,
            this.services.userRepository,
            this.services.paystackService,
            this.services.emailService
        );

        this.services.DeleteTransactionUseCase = new DeleteTransaction(
            this.services.transactionRepository
        );

        this.services.paymentController = new PaymentController(
            this.services.addFundsUseCase,
            this.services.getWalletBalanceUseCase,
            this.services.paystackService,
        );

        this.services.transactionController = new TransactionController(
            this.services.getTransactionsUseCase,
            this.services.getTransactionStatsUseCase,
            this.services.DeleteTransactionUseCase,
            this.services.transactionRepository
        );

        /** End of money */

        // team members
        this.services.getTeamMembersUseCase = new GetTeamMembers(
            this.services.userRepository
        );

        this.services.activateTeamMemberUseCase = new ActivateTeamMember(
            this.services.userRepository
        );

        this.services.removeTeamMemberUseCase = new RemoveTeamMember(
            this.services.userRepository
        );
        this.services.inviteTeamMemberUseCase = new InviteTeamMember(
            this.services.userRepository,
            this.services.emailService,
            this.services.hashService,
            this.services.configurationService
        );
        this.services.teamController = new TeamController(
            this.services.inviteTeamMemberUseCase,
            this.services.getTeamMembersUseCase,
            this.services.activateTeamMemberUseCase,
            this.services.registerMemberUseCase,
            this.services.removeTeamMemberUseCase,
            this.services.resendVerificationEmailUseCase
        );
        /** End of team members */

        // Controllers
        this.services.reportController = new ReportController(
            this.services.pdfService,
            this.services.verificationRepository,
            this.services.bulkVerificationRepository,
            this.services.transactionRepository,
            this.services.analyticsRepository
        );

        this.services.analyticsController = new AnalyticsController(
            this.services.getUserAnalyticsUseCase,
            this.services.getAdminStatsUseCase
        );

    }

    get(serviceName) {
        const service = this.services[serviceName];
        if (!service) {
            throw new Error(`Service ${serviceName} not found in DI container`);
        }
        return service;
    }
}

module.exports = DIContainer;