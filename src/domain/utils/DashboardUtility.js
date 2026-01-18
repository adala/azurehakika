class DashboardUtility {

    /**
     * Get dashboard data for a user
     * @param {string} userId - User ID
     * @param {Object} options - Additional options (time range, filters, etc.)
     * @returns {Promise<Object>} Formatted dashboard data
     */
    async getDashboardData(userId, dashboardUsecase, options = {}) {

        console.log(`[DashboardController] Fetching dashboard data for user: ${userId}`);

        // Validate input
        if (!userId) {
            throw new Error('User ID is required');
        }

        // Get raw data from use case
        const rawData = await dashboardUsecase.execute(userId, options);

        // Prepare and format the data for presentation
        const formattedData = this.prepareDashboardData(rawData);

        console.log(`[DashboardController] Successfully prepared dashboard data for user: ${userId}`);
        return {
            success: true,
            dashboardData: formattedData.dashboardData,
            timestamp: new Date().toISOString()
        };

    }

    /**
     * Prepare dashboard data for presentation layer
     */
    prepareDashboardData(rawData) {
        const {
            verifications = [],
            transactions = [],
            walletBalance = 0,
            institutions = [],
            teamMembers = [],
            analytics = {}
        } = rawData;

        const verificationCounts = this.calculateVerificationCounts(verifications);
        const recentVerifications = this.getRecentVerifications(verifications, institutions);
        const recentTransactions = this.getRecentTransactions(transactions);
        const balanceStatus = this.determineBalanceStatus(walletBalance);

        return {
            dashboardData: {
                // Verification counts
                pendingCount: verificationCounts.pending,
                processingCount: verificationCounts.processing,
                completedCount: verificationCounts.completed,
                failedCount: verificationCounts.failed,
                autoVerificationsCount: verificationCounts.auto,
                totalVerifications: verificationCounts.total,

                // Wallet information
                walletBalance: walletBalance,
                lowBalance: balanceStatus === 'low',
                okBalance: balanceStatus === 'ok',
                goodBalance: balanceStatus === 'good',

                // Recent activity
                recentVerifications: recentVerifications,
                recentTransactions: recentTransactions,

                // Analytics
                successRate: analytics.successRate || this.calculateSuccessRate(verifications),
                averageProcessingTime: analytics.averageProcessingTime || this.calculateAverageProcessingTime(verifications),
                monthlySpending: analytics.monthlySpending || this.calculateMonthlySpending(transactions),

                // Additional metrics
                institutionsCount: institutions.length,
                teamMembersCount: teamMembers.length,
                pendingActions: this.calculatePendingActions(verifications),

                // Performance metrics
                verificationTrend: analytics.verificationTrend || this.calculateVerificationTrend(verifications),
                costAnalysis: analytics.costAnalysis || this.calculateCostAnalysis(transactions, verifications)
            },
            metadata: {
                lastUpdated: new Date().toISOString(),
                dataSource: 'dashboard-use-case',
                cacheable: true,
                ttl: 300 // 5 minutes
            }
        };
    }

    calculateInstCount(inst) {
        let count = 0;
        inst.forEach(verification => {
            count++;
        });
        return count;
    }


    /**
    * Calculate verification counts by status
    */
    calculateVerificationCounts(verifications) {
        const counts = {
            pending: 0,
            processing: 0,
            completed: 0,
            failed: 0,
            auto: 0,
            total: verifications.length
        };

        verifications.forEach(verification => {
            if (verification.process === 'auto')
                counts.auto++;
            switch (verification.status) {
                case 'pending':
                case 'pending_assignment':
                    counts.pending++;
                    break;
                case 'processing':
                case 'requires_review':
                case 'under_review':
                    counts.processing++;
                    break;
                case 'completed':
                case 'verified':
                    counts.completed++;
                    break;
                case 'failed':
                case 'rejected':
                    counts.failed++;
                    break;
            }
        });

        return counts;
    }
    // ... (include all the helper methods from previous implementation)
    // calculateVerificationCounts, getRecentVerifications, getRecentTransactions, 
    // determineBalanceStatus, calculateSuccessRate, calculateAverageProcessingTime,
    // calculateMonthlySpending, calculatePendingActions, calculateVerificationTrend,
    // calculateCostAnalysis, etc.

    /**
     * Calculate verification trend over time
     */
    calculateVerificationTrend(verifications) {
        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 30);

        const recentVerifications = verifications.filter(v =>
            new Date(v.createdAt) >= last30Days
        );

        const previousPeriod = new Date();
        previousPeriod.setDate(previousPeriod.getDate() - 60);
        const previousVerifications = verifications.filter(v =>
            new Date(v.createdAt) >= previousPeriod && new Date(v.createdAt) < last30Days
        );

        const currentCount = recentVerifications.length;
        const previousCount = previousVerifications.length;

        if (previousCount === 0) return currentCount > 0 ? 100 : 0;

        return ((currentCount - previousCount) / previousCount) * 100;
    }

    /**
    * Get recent verifications with institution data
    */
    getRecentVerifications(verifications, institutions) {
        // Sort by creation date (newest first)
        const sorted = [...verifications].sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        );

        // Take latest 5
        const recent = sorted.slice(0, 5);

        // Enrich with institution data
        return recent.map(verification => {
            const institution = institutions.find(inst =>
                inst.id === verification.institutionId
            ) || { name: 'Unknown Institution', country: 'Unknown' };

            return {
                id: verification.id,
                institution: {
                    name: institution.name,
                    country: institution.country,
                    logo: institution.logo
                },
                referenceNumber: verification.referenceNumber,
                status: verification.status,
                fee: verification.fee || 0,
                createdAt: verification.createdAt,
                updatedAt: verification.updatedAt,
                studentName: verification.firstName.concat(" ", verification.lastName),
                courseName: verification.courseName,
                degreeType: verification.degreeType,
                classification: verification.classification,
                process: verification.process,
                priority: verification.priority
            };
        });
    }

    /**
     * Get recent transactions formatted for display
     */
    getRecentTransactions(transactions) {
        const sorted = [...transactions].sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        );

        return sorted.slice(0, 5).map(transaction => ({
            id: transaction.id,
            description: transaction.description,
            amount: transaction.amount,
            reference: transaction.reference,
            type: transaction.type,
            status: transaction.status,
            createdAt: transaction.createdAt,
            formattedAmount: this.formatCurrency(Math.abs(transaction.amount)),
            isCredit: transaction.amount > 0
        }));
    }

    /**
     * Determine wallet balance status
     */
    determineBalanceStatus(balance) {
        if (balance < 5) {
            return 'low';
        } else if (balance < 20) {
            return 'ok';
        } else {
            return 'good';
        }
    }

    /**
     * Calculate verification success rate
     */
    calculateSuccessRate(verifications) {
        if (verifications.length === 0) return 0;

        const completed = verifications.filter(v =>
            v.status === 'completed' || v.status === 'verified'
        ).length;

        return Math.round((completed / verifications.length) * 100);
    }

    /**
     * Calculate cost analysis
     */
    calculateCostAnalysis(transactions, verifications) {
        const monthlySpending = this.calculateMonthlySpending(transactions);
        const completedThisMonth = verifications.filter(v =>
            v.status === 'completed' &&
            new Date(v.updatedAt).getMonth() === new Date().getMonth()
        ).length;

        return {
            monthlySpending,
            completedCount: completedThisMonth,
            averageCostPerVerification: completedThisMonth > 0 ?
                monthlySpending / completedThisMonth : 0
        };
    }

    /**
 * Calculate average processing time in days
 */
    calculateAverageProcessingTime(verifications) {
        const completedVerifications = verifications.filter(v =>
            v.status === 'completed' && v.createdAt && v.updatedAt
        );

        if (completedVerifications.length === 0) return 0;

        const totalProcessingTime = completedVerifications.reduce((total, verification) => {
            const start = new Date(verification.createdAt);
            const end = new Date(verification.updatedAt);
            const processingTime = (end - start) / (1000 * 60 * 60 * 24); // Convert to days
            return total + processingTime;
        }, 0);

        return Math.round(totalProcessingTime / completedVerifications.length);
    }

    /**
     * Calculate monthly spending
     */
    calculateMonthlySpending(transactions) {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const monthlyTransactions = transactions.filter(transaction => {
            const transactionDate = new Date(transaction.createdAt);
            return transactionDate.getMonth() === currentMonth &&
                transactionDate.getFullYear() === currentYear &&
                transaction.amount < 0; // Debits (spending)
        });

        return Math.abs(monthlyTransactions.reduce((total, transaction) =>
            total + transaction.amount, 0
        ));
    }

    /**
     * Calculate pending actions requiring attention
     */
    calculatePendingActions(verifications) {
        return verifications.filter(verification =>
            verification.status === 'requires_review' ||
            verification.status === 'pending_assignment'
        ).length;
    }
    formatCurrency(amount) {
        return parseFloat(amount).toFixed(2);
    }
}

module.exports = DashboardUtility;