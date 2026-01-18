const fs = require('fs');
const { Op } = require('sequelize');
class ReportController {
    constructor(
        pdfService,
        verificationRepository,
        bulkVerificationRepository,
        transactionRepository,
        analyticsRepository
    ) {
        this.pdfService = pdfService;
        this.verificationRepository = verificationRepository;
        this.bulkVerificationRepository = bulkVerificationRepository;
        this.transactionRepository = transactionRepository;
        this.analyticsRepository = analyticsRepository;
    }

    async downloadVerificationReport(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const verification = await this.verificationRepository.findById(userId, id);

            if (!verification || verification.userId !== userId) {
                return res.status(404).json({
                    success: false,
                    message: 'Verification not found'
                });
            }

            const report = await this.pdfService.generateVerificationReport(verification);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);

            const stream = fs.createReadStream(report.filePath);
            stream.pipe(res);

            // Cleanup file after streaming
            stream.on('close', () => {
                fs.unlinkSync(report.filePath);
            });

        } catch (error) {
            console.log(error);
            if (!res.headersSent) {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
        }
    }

    // In your transaction controller
    async downloadTransactionReport(req, res) {
        try {
            const userId = req.user.id;
            const filters = req.query; // Get filters from query params

            // Fetch transactions based on filters
            const transactions = await this.transactionRepository.getTransactionReportData(userId, filters);
          
            // Prepare data for PDF
            const transactionData = {
                transactions: transactions.map(t => ({
                    id: t.id,
                    transactionId: t.transactionId,
                    referenceNumber: t.referenceNumber,
                    createdAt: t.createdAt,
                    amount: t.amount,
                    currency: t.currency,
                    status: t.status,
                    type: t.type,
                    paymentMethod: t.paymentMethod,
                    description: t.description,
                    Verification: t.Verification
                })),
                summary: {
                    dateRange: filters.dateRange || 'All Time',
                    status: filters.status || 'All',
                    paymentMethod: filters.paymentMethod || 'All'
                }
            };

            const report = await this.pdfService.generateTransactionReport(transactionData, filters);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);

            const stream = fs.createReadStream(report.filePath);
            stream.pipe(res);

            // Cleanup file after streaming
            stream.on('close', () => {
                fs.unlinkSync(report.filePath);
            });

        } catch (error) {
            console.error('Transaction report error:', error);
            if (!res.headersSent) {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
        }
    }

    // In your transaction controller
    async downloadTransactionReportPDF(req, res) {
        try {
            const userId = req.user.id;
            const filters = req.query;

            // Build where clause safely
            let whereClause = {
                userId: userId,
            };

            // Add status filter if valid
            if (filters.status && filters.status !== 'all') {
                whereClause.status = filters.status;
            }

            // Add payment method filter if valid
            if (filters.paymentMethod && filters.paymentMethod !== 'all') {
                whereClause.paymentMethod = filters.paymentMethod;
            }

            // Handle date filters safely
            const createdAtConditions = {};

            // Handle predefined date ranges
            const now = new Date();
            switch (filters.dateRange) {
                case 'today':
                    const todayStart = new Date(now.setHours(0, 0, 0, 0));
                    const todayEnd = new Date(now.setHours(23, 59, 59, 999));
                    createdAtConditions[Op.gte] = todayStart;
                    createdAtConditions[Op.lte] = todayEnd;
                    break;
                case 'yesterday':
                    const yesterday = new Date(now.setDate(now.getDate() - 1));
                    const yesterdayStart = new Date(yesterday.setHours(0, 0, 0, 0));
                    const yesterdayEnd = new Date(yesterday.setHours(23, 59, 59, 999));
                    createdAtConditions[Op.gte] = yesterdayStart;
                    createdAtConditions[Op.lte] = yesterdayEnd;
                    break;
                case 'week':
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    createdAtConditions[Op.gte] = weekAgo;
                    break;
                case 'month':
                    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    createdAtConditions[Op.gte] = monthAgo;
                    break;
                case 'quarter':
                    const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                    createdAtConditions[Op.gte] = quarterAgo;
                    break;
                case 'year':
                    const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                    createdAtConditions[Op.gte] = yearAgo;
                    break;
            }

            // Helper function to validate date
            function isValidDate(dateString) {
                if (!dateString) return false;
                const date = new Date(dateString);
                return date instanceof Date && !isNaN(date);
            }

            // Override with custom dates if provided and valid
            if (filters.fromDate && isValidDate(filters.fromDate)) {
                createdAtConditions[Op.gte] = new Date(filters.fromDate);
            }

            if (filters.toDate && isValidDate(filters.toDate)) {
                createdAtConditions[Op.lte] = new Date(filters.toDate);
            }

            // Add createdAt conditions if they exist
            if (Object.keys(createdAtConditions).length > 0) {
                whereClause.createdAt = createdAtConditions;
            }

            // Fetch transactions based on filters
            const transactions = await this.transactionRepository.getTransactionReportData(userId, filters, whereClause);

            // Prepare data for PDF
            const transactionData = {
                transactions: transactions.map(t => ({
                    id: t.id,
                    transactionId: t.transactionId,
                    referenceNumber: t.referenceNumber,
                    createdAt: t.createdAt,
                    amount: t.amount,
                    currency: t.currency,
                    status: t.status,
                    type: t.type,
                    paymentMethod: t.paymentMethod,
                    description: t.description,
                    Verification: t.Verification,
                    metadata: t.metadata
                }))
            };

            // Generate PDF report
            const report = await this.pdfService.generateTransactionReport(transactionData, filters);

            // Set headers for PDF download
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);

            // Stream the PDF file
            const fileStream = fs.createReadStream(report.filePath);
            fileStream.pipe(res);

            // Cleanup after streaming
            fileStream.on('close', () => {
                // Optional: Delete the temp file after sending
                // fs.unlinkSync(report.filePath);
            });

            fileStream.on('error', (error) => {
                console.error('Error streaming PDF:', error);
                if (!res.headersSent) {
                    res.status(500).json({
                        success: false,
                        message: 'Error generating PDF report'
                    });
                }
            });

        } catch (error) {
            console.error('Transaction PDF report error:', error);
            if (!res.headersSent) {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
        }
    }

    async downloadBulkVerificationReport(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.userId;

            const bulkVerification = await this.bulkVerificationRepository.findById(id);

            if (!bulkVerification || bulkVerification.userId !== userId) {
                return res.status(404).json({
                    success: false,
                    message: 'Bulk verification not found'
                });
            }

            const report = await this.pdfService.generateBulkVerificationReport(bulkVerification.toJSON());

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);

            res.download(report.filePath, report.filename);

        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async downloadTransactionReceipt(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.userId;

            const transaction = await this.transactionRepository.findByReference(id);

            if (!transaction || transaction.userId !== userId) {
                return res.status(404).json({
                    success: false,
                    message: 'Transaction not found'
                });
            }

            const receipt = await this.pdfService.generateTransactionReceipt(transaction.toJSON());

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${receipt.filename}"`);

            res.download(receipt.filePath, receipt.filename);

        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async downloadAnalyticsReport(req, res) {
        try {
            const userId = req.user.userId;
            const { period = 'monthly' } = req.query;

            const analyticsData = await this.analyticsRepository.getUserAnalytics(userId, period);
            const report = await this.pdfService.generateAnalyticsReport(analyticsData, period);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);

            res.download(report.filePath, report.filename);

        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async generateCustomReport(req, res) {
        try {
            const userId = req.user.userId;
            const { type, startDate, endDate, format = 'pdf' } = req.body;

            let report;
            switch (type) {
                case 'verifications_summary':
                    const verifications = await this.verificationRepository.findByUserId(userId);
                    // Generate custom verification summary report
                    break;
                case 'financial_summary':
                    const transactions = await this.transactionRepository.findByUserId(userId, 1000);
                    // Generate financial summary report
                    break;
                default:
                    throw new Error('Unsupported report type');
            }

            if (format === 'pdf') {
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="custom-report-${Date.now()}.pdf"`);
                res.status(200);
                res.download(report.filePath);
            } else {
                // Handle other formats (JSON, CSV, etc.)
                res.status(200).json({
                    success: true,
                    data: report.data
                });
            }

        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Helper method to cleanup report files
    async cleanupReportFile(filePath) {
        try {
            const fs = require('fs');
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (error) {
            console.error('Error cleaning up report file:', error);
        }
    }
}

module.exports = ReportController;