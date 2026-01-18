class BulkVerificationController {
    constructor(
        processBulkVerificationUseCase,
        getBulkVerificationsUseCase,
        getBulkStatsUseCase,
        bulkVerificationRepository
    ) {
        this.processBulkVerification = processBulkVerificationUseCase;
        this.getBulkVerifications = getBulkVerificationsUseCase;
        this.getBulkStats = getBulkStatsUseCase;
        this.bulkVerificationRepository = bulkVerificationRepository;
    }

    async processBulk(req, res) {
        try {
            const userId = req.user.userId;
            const { name, records, options } = req.body;
            const file = req.file;

            if (!file) {
                throw new Error('Bulk file is required');
            }

            const result = await this.processBulkVerification.execute(
                userId,
                { name, records, options },
                file
            );

            res.json({
                success: true,
                message: 'Bulk verification started successfully',
                data: result
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async getBulkVerifications(req, res) {
        try {
            const userId = req.user.userId;
            const { limit = 20 } = req.query;

            const bulkVerifications = await this.getBulkVerifications.execute(userId, parseInt(limit));

            res.json({
                success: true,
                data: bulkVerifications
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async getBulkStats(req, res) {
        try {
            const userId = req.user.userId;
            const stats = await this.getBulkStats.execute(userId);

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async getBulkVerificationById(req, res) {
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

            res.json({
                success: true,
                data: bulkVerification.toJSON()
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async searchBulkVerifications(req, res) {
        try {
            const userId = req.user.userId;
            const searchCriteria = req.body;

            const bulkVerifications = await this.bulkVerificationRepository.searchBulkVerifications(
                userId,
                searchCriteria
            );

            res.json({
                success: true,
                data: bulkVerifications.map(bulk => bulk.toJSON())
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async getBulkSummary(req, res) {
        try {
            const userId = req.user.userId;
            const summary = await this.bulkVerificationRepository.getBulkVerificationSummary(userId);

            res.json({
                success: true,
                data: summary
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async cancelBulkVerification(req, res) {
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

            if (!['pending', 'processing'].includes(bulkVerification.status)) {
                throw new Error('Only pending or processing bulk verifications can be cancelled');
            }

            const updatedBulk = await bulkVerification.cancelProcessing();

            res.json({
                success: true,
                message: 'Bulk verification cancelled successfully',
                data: updatedBulk.toJSON()
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async deleteBulkVerification(req, res) {
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

            await this.bulkVerificationRepository.deleteBulkVerification(id);

            res.json({
                success: true,
                message: 'Bulk verification deleted successfully'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Render methods
    showBulkUpload(req, res) {
        res.render('dashboard/bulk-upload', {
            title: 'Bulk Verification - AcademicVerify',
            user: req.user
        });
    }

    showBulkResults(req, res) {
        res.render('dashboard/bulk-results', {
            title: 'Bulk Results - AcademicVerify',
            user: req.user
        });
    }

    showBulkHistory(req, res) {
        res.render('dashboard/bulk-history', {
            title: 'Bulk History - AcademicVerify',
            user: req.user
        });
    }

    showBulkDetails(req, res) {
        res.render('dashboard/bulk-details', {
            title: 'Bulk Details - AcademicVerify',
            user: req.user,
            bulkId: req.params.id
        });
    }
}

module.exports = BulkVerificationController;