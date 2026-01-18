// useCases/DashboardUseCase.js
class DashboardUseCase {
    constructor(
        verificationRepository,
        transactionRepository,
        walletRepository,
        institutionRepository,
        teamRepository,
        analyticsService
    ) {
        this.verificationRepository = verificationRepository;
        this.transactionRepository = transactionRepository;
        this.walletRepository = walletRepository;
        this.institutionRepository = institutionRepository;
        this.teamRepository = teamRepository;
        this.analyticsService = analyticsService;
    }

    /**
     * Execute the dashboard use case
     * @param {string} userId - User ID
     * @param {Object} options - Options for data retrieval
     * @returns {Promise<Object>} Raw dashboard data
     */
    async execute(userId, options = {}) {
        try {
            console.log(`[DashboardUseCase] Executing for user: ${userId}`);

            const {
                timeRange = '30d',
                includeAnalytics = false,
                refreshCache = false
            } = options;

            // Fetch all data in parallel for performance
            const [
                verifications,
                transactions,
                walletBalance,
                institutions,
                //teamMembers,
                //analytics
            ] = await Promise.all([
                this.getVerificationData(userId, timeRange),
                this.getTransactionData(userId, timeRange),
                this.getWalletData(userId),
                this.getInstitutionData(),
              //  this.getTeamData(userId),
                includeAnalytics ? this.getAnalyticsData(userId, timeRange) : Promise.resolve({})
            ]);

            return {
                verifications,
                transactions,
                walletBalance,
                institutions,
               // teamMembers,
               // analytics,
                // metadata: {
                //     timeRange,
                //     includeAnalytics,
                //     dataFetchedAt: new Date().toISOString()
                // }
            };

        } catch (error) {
            console.error(`[DashboardUseCase] Error executing for user ${userId}:`, error);
            throw new Error(`Failed to retrieve dashboard data: ${error.message}`);
        }
    }

    /**
     * Get user profile data
     */
    async getUserData(userId) {
        try {
            const user = await this.userRepository.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }
            return user;
        } catch (error) {
            console.error(`[DashboardUseCase] Error getting user data:`, error);
            throw new Error(`Failed to retrieve user data: ${error.message}`);
        }
    }

    /**
     * Get verification data with optional time range
     */
    async getVerificationData(id, timeRange) {
        try {
            return await this.verificationRepository.findByUserId(id);
        } catch (error) {
            console.error(`[DashboardUseCase] Error getting verification data:`, error);
            // Return empty array instead of failing completely
            return [];
        }
    }

    /**
     * Get transaction data
     */
    async getTransactionData(userId, timeRange) {
        try {
            const dateFilter = this.calculateDateFilter(timeRange);
            return await this.transactionRepository.findByUserId(userId);
        } catch (error) {
            console.error(`[DashboardUseCase] Error getting transaction data:`, error);
            return [];
        }
    }

    /**
     * Get wallet balance
     */
    async getWalletData(userId) {
        try {
            const wallet = await this.walletRepository.findByUserId(userId);
            return wallet?.balance || 0;
        } catch (error) {
            console.error(`[DashboardUseCase] Error getting wallet data:`, error);
            return 0;
        }
    }

    /**
     * Get available institutions
     */
    async getInstitutionData() {
        try {
            return await this.institutionRepository.listAll();
        } catch (error) {
            console.error(`[DashboardUseCase] Error getting institution data:`, error);
            return [];
        }
    } 

    /**
     * Get team members
     */
    async getTeamData(userId) {
        try {

            return await this.teamRepository.findByUserId(userId);

        } catch (error) {
            console.error(`[DashboardUseCase] Error getting team data:`, error);
            return [];
        }
    }

    /**
     * Get analytics data
     */
    async getAnalyticsData(userId, timeRange) {
        try {
            if (!this.analyticsService) {
                return {}; 
            }
            return await this.analyticsService.getUserAnalytics(userId, timeRange);
        } catch (error) {
            console.error(`[DashboardUseCase] Error getting analytics data:`, error);
            return {};
        }
    }

    /**
     * Calculate date filter based on time range
     */
    calculateDateFilter(timeRange) {
        const now = new Date();
        const fromDate = new Date();

        switch (timeRange) {
            case '7d':
                fromDate.setDate(now.getDate() - 7);
                break;
            case '30d':
                fromDate.setDate(now.getDate() - 30);
                break;
            case '90d':
                fromDate.setDate(now.getDate() - 90);
                break;
            case '1y':
                fromDate.setFullYear(now.getFullYear() - 1);
                break;
            default:
                fromDate.setDate(now.getDate() - 30); // Default to 30 days
        }

        return { from: fromDate, to: now };
    }
}

module.exports = DashboardUseCase;