class AssigneeController {
    constructor(
        getAssigneeTasksUseCase, 
        processManualVerificationUseCase, 
        processApiVerificationUseCase) {
        this.getAssigneeTasks = getAssigneeTasksUseCase;
        this.processManualVerification = processManualVerificationUseCase;
        this.processApiVerificationUseCase = processApiVerificationUseCase;
    }

    async getDashboard(req, res) {
        try {
            const assigneeId = req.user.id;
            const tasks = await this.getAssigneeTasks.execute(assigneeId);

            res.render('assignee/dashboard', {
                user: req.user,
                tasks,
                apiTasksCount: tasks.api.length,
                manualTasksCount: tasks.manual.length,
                totalTasks: tasks.api.length + tasks.manual.length
            });
        } catch (error) {
            res.status(500).render('error', { 
                message: 'Failed to load dashboard',
                error: error.message 
            });
        }
    }

    async showManualEntryForm(req, res) {
        try {
            const { assignmentId } = req.params;
            const assigneeId = req.user.id;

            const assignment = await this.processManualVerification.assignmentRepository.findById(assignmentId);
            
            if (!assignment || assignment.assigneeId !== assigneeId) {
                return res.status(403).render('error', { 
                    message: 'Unauthorized access to assignment' 
                });
            }

            const verification = await this.processApiVerification.verificationRepository.findById(assignment.verificationId);
            const institution = await this.processApiVerification.institutionRepository.findById(assignment.institutionId);

            res.render('assignee/manual-entry', {
                user: req.user,
                assignment,
                verification,
                institution
            });
        } catch (error) {
            res.status(500).render('error', { 
                message: 'Failed to load manual entry form',
                error: error.message 
            });
        }
    }

    async processManualEntry(req, res) {
        try {
            const { assignmentId } = req.params;
            const assigneeId = req.user.id;
            const entryData = req.body;

            // Validate required fields
            if (!entryData.verificationScore || !entryData.data) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields'
                });
            }

            const result = await this.processManualVerification.execute(
                assignmentId, 
                entryData, 
                assigneeId
            );

            res.json({
                success: true,
                data: result,
                message: 'Manual verification submitted successfully'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    async processApiVerification(req, res) {
        try {
            const { assignmentId } = req.params;
            const assigneeId = req.user.id;

            const result = await this.processApiVerificationUseCase.execute(assignmentId, assigneeId);

            res.json({
                success: true,
                data: result,
                message: 'API verification processed successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'API verification failed'
            });
        }
    }

    async getProcessingStatus(req, res) {
        try {
            const { assignmentId } = req.params;
            const assigneeId = req.user.id;

            const assignment = await this.processManualVerification.assignmentRepository.findById(assignmentId);
            
            if (!assignment || assignment.assigneeId !== assigneeId) {
                return res.status(403).json({
                    success: false,
                    error: 'Unauthorized'
                });
            }

            // Get the latest institution response
            const institutionResponse = await this.useCases.institutionResponseRepo.findByVerificationId(
                assignment.verificationId
            );

            res.json({
                success: true,
                data: {
                    assignmentStatus: assignment.status,
                    institutionResponse: institutionResponse ? {
                        status: institutionResponse.status,
                        verificationScore: institutionResponse.verificationScore,
                        processedAt: institutionResponse.processedAt,
                        isVerified: institutionResponse.isVerified
                    } : null
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = AssigneeController;