const IAssignmentRepository = require('../../domain/interfaces/IAssignmentRepository');
const VerificationAssignment = require('../../domain/entities/VerificationAssignment');
const Assignment = require('../database/models/system/Assignment');
const Verification = require('../database/models/Verification');
const Institution = require('../database/models/system/Institution');
const InstitutionResponse = require('../database/models/InstitutionResponse');
const User = require('../database/models/User');

class AssignmentRepository extends IAssignmentRepository {
    async toDomain(sequelizeModel) {
        if (!sequelizeModel) return null;
        return new VerificationAssignment(sequelizeModel.toJSON());
    }

    async create(assignment) {
        const created = await Assignment.create({
            verificationId: assignment.verificationId,
            assigneeId: assignment.assigneeId,
            assignedBy: assignment.assignedBy,
            assignedAt: assignment.assignedAt,
            dueDate: assignment.dueDate,
            status: assignment.status,
            connectionType: assignment.connectionType,
            institutionId: assignment.institutionId,
            priority: assignment.priority,
            notes: assignment.notes
        });
        return this.toDomain(created);
    }

    async findByAssignee(assigneeId) {
        const assignments = await Assignment.findAll({
            where: { assigneeId },
            include: [
                {
                    model: Verification,
                    as: 'verification',
                    include: [{
                        model: Institution,
                        as: 'institution'
                    }]
                },
                {
                    model: User,
                    as: 'assigner',
                    attributes: ['id', 'name', 'email']
                }
            ],
            order: [['priority', 'DESC'], ['assignedAt', 'DESC']]
        });
        return assignments.map(a => this.toDomain(a));
    }

    async findByAssigneeAndStatus(assigneeId, status) {
        const assignments = await Assignment.findAll({
            where: { assigneeId, status },
            include: [
                {
                    model: Verification,
                    as: 'verification',
                    include: [{
                        model: Institution,
                        as: 'institution',
                        attributes: ['id', 'name', 'connectionType']
                    }]
                }
            ],
            order: [['priority', 'DESC'], ['assignedAt', 'ASC']]
        });
        return assignments.map(a => this.toDomain(a));
    }

    async updateStatus(id, status) {
        const [affectedRows] = await Assignment.update(
            { status },
            { where: { id } }
        );
        return affectedRows > 0;
    }

    async countByStatus(status) {
        return await Assignment.count({
            where: { status }
        });
    }

    async countBySupervisorAndStatus(supervisorId, status) {
        return await Assignment.count({
            where: {
                assignedBy: supervisorId,
                status
            }
        });
    }

    async countByAssigneeAndStatus(assigneeId, status) {
        return await Assignment.count({
            where: {
                assigneeId,
                status
            }
        });
    }

    async countOverdueBySupervisor(supervisorId) {
        return await Assignment.count({
            where: {
                assignedBy: supervisorId,
                dueDate: { [Op.lt]: new Date() },
                status: { [Op.in]: ['pending', 'processing'] }
            }
        });
    }

    async countOverdueByAssignee(assigneeId) {
        return await Assignment.count({
            where: {
                assigneeId,
                dueDate: { [Op.lt]: new Date() },
                status: { [Op.in]: ['pending', 'processing'] }
            }
        });
    }

    async getTeamProductivity(supervisorId) {
        const result = await Assignment.findAll({
            attributes: [
                [sequelize.fn('AVG', sequelize.literal('TIMESTAMPDIFF(MINUTE, assignedAt, completedAt)')), 'avgTime'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
                [sequelize.fn('SUM', sequelize.literal('CASE WHEN status = "completed" THEN 1 ELSE 0 END')), 'completed']
            ],
            where: {
                assignedBy: supervisorId,
                status: { [Op.in]: ['completed', 'failed'] }
            },
            raw: true
        });

        if (result[0] && result[0].total > 0) {
            return (result[0].completed / result[0].total) * 100;
        }
        return 0;
    }

    async getWorkerAccuracy(workerId) {
        const result = await Assignment.findAll({
            include: [{
                model: InstitutionResponse,
                as: 'institutionResponse',
                attributes: ['verificationScore']
            }],
            where: {
                assigneeId: workerId,
                status: 'completed'
            }
        });

        if (result.length === 0) return 0;

        const totalScore = result.reduce((sum, assignment) => {
            return sum + (assignment.institutionResponse?.verificationScore || 0);
        }, 0);

        return totalScore / result.length;
    }
}

module.exports = AssignmentRepository;