
class GetAssigneeTasks {
    constructor(assignmentRepository, verificationRepository ){
        this.assignmentRepository = assignmentRepository;
        this.verificationRepository = verificationRepository;
    }
    async execute(assigneeId) {
        const pendingAssignments = await this.assignmentRepository.findByAssigneeAndStatus(assigneeId, 'pending');
        
        // Group by institution type
        const tasks = {
            api: [],
            manual: []
        };

        for (const assignment of pendingAssignments) {
            const verification = await this.verificationRepository.findById(assignment.verificationId);
            
            if (!verification) continue;

            const task = {
                assignmentId: assignment.id,
                verificationId: verification.id,
                referenceNumber: verification.referenceNumber,
                studentName: `${verification.firstName} ${verification.lastName}`,
                institutionName: verification.institution?.name || 'Unknown',
                assignedDate: assignment.assignedAt,
                dueDate: assignment.dueDate,
                priority: assignment.priority,
                isOverdue: assignment.isOverdue()
            };

            if (assignment.connectionType === 'api') {
                tasks.api.push(task);
            } else {
                tasks.manual.push(task);
            }
        }

        return tasks;
    }
}

module.exports = GetAssigneeTasks;