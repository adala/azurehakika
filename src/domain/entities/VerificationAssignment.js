class VerificationAssignment {
    constructor({
        id,
        verificationId,
        assigneeId,
        assignedBy,
        assignedAt = new Date(),
        dueDate,
        status = 'pending',
        connectionType,
        institutionId,
        priority = 'medium',
        notes
    }) {
        this.id = id;
        this.verificationId = verificationId;
        this.assigneeId = assigneeId;
        this.assignedBy = assignedBy;
        this.assignedAt = assignedAt;
        this.dueDate = dueDate;
        this.status = status;
        this.connectionType = connectionType;
        this.institutionId = institutionId;
        this.priority = priority;
        this.notes = notes;
    }

    canBeProcessedBy(userId) {
        return this.assigneeId === userId && this.status === 'pending';
    }

    markAsProcessing() {
        this.status = 'processing';
        return this;
    }

    markAsCompleted() {
        this.status = 'completed';
        return this;
    }

    isOverdue() {
        return this.dueDate && new Date() > new Date(this.dueDate);
    }
}

module.exports = VerificationAssignment;