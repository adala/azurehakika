// domain/entities/Verification.js

class Verification {
    constructor(data = {}) {
        this.id = data.id;
        this.userId = data.userId;
        this.institutionId = data.institutionId;
        this.firstName = data.firstName || '';
        this.lastName = data.lastName || '';
        this.maidenName = data.maidenName || null;
        this.dateOfBirth = data.dateOfBirth || null;
        this.fieldOfStudy = data.courseName || '',
        this.courseName = data.courseName || '';
        this.degreeType = data.degreeType || '';
        this.classification = data.classification || null;
        this.graduationYear = data.graduationYear || null;
        this.studentId = data.studentId || null;
        this.additionalNotes = data.additionalNotes || null;
        this.consentAgreement = data.consentAgreement || false;
        this.certificateFile = data.certificateFile || null;
        this.consentFile = data.consentFile || null;
        this.fee = data.fee || 0;
        this.referenceNumber = data.referenceNumber || '';
        this.status = data.status || 'pending';
        this.process = data.process || null;
        this.aiAgentResponse = data.aiAgentResponse || null;
        this.processingStartedAt = data.processingStartedAt || null;
        this.processingStartedAt = data.processingEndedAt || null;
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
    }

    /**
     * Create a Verification instance from form data
     * @param {Object} data - Form data
     * @param {Object} files - Uploaded files (optional, can also be included in data)
     * @returns {Verification}
     */
    static createFromForm(data, files = null) {
        console.log('Creating verification from form data:', {
            data: { ...data, consentAgreement: data.consentAgreement ? 'true' : 'false' },
            files: files ? {
                certificate: files.certificate ? '[FILE OBJECT]' : null,
                consentForm: files.consentForm ? '[FILE OBJECT]' : null
            } : null
        });

        // Handle file paths - they might be in data or in files parameter
        let certificateFile = data.certificateFile;
        let consentFile = data.consentFile;

        // If files are provided as separate parameter, extract paths
        if (files) {
            if (files.certificate && files.certificate.path) {
                certificateFile = files.certificate.path;
            }
            if (files.consentForm && files.consentForm.path) {
                consentFile = files.consentForm.path;
            }
        }

        // If files are in data as objects, extract paths
        if (data.certificateFile && typeof data.certificateFile === 'object' && data.certificateFile.path) {
            certificateFile = data.certificateFile.path;
        }
        if (data.consentFile && typeof data.consentFile === 'object' && data.consentFile.path) {
            consentFile = data.consentFile.path;
        }

        const verificationData = {
            userId: data.userId,
            institutionId: data.institutionId,
            firstName: data.firstName,
            lastName: data.lastName,
            maidenName: data.maidenName || null,
            dateOfBirth: data.dateOfBirth,
            courseName: data.courseName,
            fieldOfStudy: data.courseName,
            degreeType: data.degreeType,
            classification: data.classification || null,
            graduationYear: parseInt(data.graduationYear),
            studentId: data.studentId || null,
            additionalNotes: data.additionalNotes || null,
            consentAgreement: data.consentAgreement === 'on' || data.consentAgreement === true,
            certificateFile: certificateFile,
            consentFile: consentFile,
            fee: data.fee || 0,
            referenceNumber: data.referenceNumber || '',
            status: data.status || 'pending'
        };

        console.log('Processed verification data:', {
            ...verificationData,
            certificateFile: certificateFile ? '[FILE PATH]' : null,
            consentFile: consentFile ? '[FILE PATH]' : null
        });

        return new Verification(verificationData);
    }

    /**
     * Alternative method to create verification without files parameter
     */
    static createFromFormData(data) {
        console.log('Creating verification from form data (alternative method):', {
            ...data,
            certificateFile: data.certificateFile ? '[FILE]' : null,
            consentFile: data.consentFile ? '[FILE]' : null
        });

        const verificationData = {
            userId: data.userId,
            institutionId: data.institutionId,
            firstName: data.firstName,
            lastName: data.lastName,
            maidenName: data.maidenName || null,
            dateOfBirth: data.dateOfBirth,
            courseName: data.courseName,
            fieldOfStudy: data.courseName,
            degreeType: data.degreeType,
            classification: data.classification || null,
            graduationYear: parseInt(data.graduationYear),
            studentId: data.studentId || null,
            additionalNotes: data.additionalNotes || null,
            consentAgreement: data.consentAgreement === 'on' || data.consentAgreement === true,
            certificateFile: data.certificateFile,
            consentFile: data.consentFile,
            fee: data.fee || 0,
            processingStartedAt: data.processingStartedAt,
            processingEndedAt: data.processingEndedAt,
            referenceNumber: data.referenceNumber || '',
            status: data.status || 'pending'
        };

        return new Verification(verificationData);
    }

    validate() {
        const errors = [];

        // Required field validation
        if (!this.firstName?.trim()) errors.push('First name is required');
        if (!this.lastName?.trim()) errors.push('Last name is required');
        if (!this.dateOfBirth) errors.push('Date of birth is required');
        if (!this.courseName?.trim()) errors.push('Course name is required');
        if (!this.fieldOfStudy?.trim()) errors.push('Course name is required');
        if (!this.degreeType?.trim()) errors.push('Degree type is required');
        if (!this.graduationYear) errors.push('Graduation year is required');
        if (!this.consentAgreement) errors.push('Consent agreement is required');
        if (!this.certificateFile) errors.push('Certificate file is required');
        if (!this.consentFile) errors.push('Consent file is required');
        if (!this.institutionId) errors.push('Institution is required');
        if (!this.userId) errors.push('User ID is required');

        // Data type validation
        if (this.graduationYear) {
            const year = parseInt(this.graduationYear);
            const currentYear = new Date().getFullYear();
            if (isNaN(year) || year < 1950 || year > currentYear) {
                errors.push('Graduation year must be a valid year between 1950 and current year');
            }
        }

        if (this.dateOfBirth) {
            const dob = new Date(this.dateOfBirth);
            const today = new Date();
            if (isNaN(dob.getTime())) {
                errors.push('Date of birth must be a valid date');
            } else if (dob >= today) {
                errors.push('Date of birth must be in the past');
            }
        }

        // File validation (basic)
        if (this.certificateFile && typeof this.certificateFile !== 'string') {
            errors.push('Certificate file path must be a string');
        }

        if (this.consentFile && typeof this.consentFile !== 'string') {
            errors.push('Consent file path must be a string');
        }

        return errors;
    }

    // Getters for derived properties
    get fullName() {
        return `${this.firstName} ${this.lastName}`.trim();
    }

    get displayName() {
        if (this.maidenName) {
            return `${this.firstName} ${this.lastName} (née ${this.maidenName})`;
        }
        return this.fullName;
    }

    get isPending() {
        return this.status === 'pending';
    }

    get isProcessing() {
        return this.status === 'processing';
    }

    get isCompleted() {
        return this.status === 'completed';
    }

    get requiresReview() {
        return this.status === 'requires_review' || this.status === 'pending_review';
    }

    // Methods to update status
    markAsProcessing() {
        this.status = 'processing';
        this.updatedAt = new Date();
    }

    markAsCompleted(aiResponse = null) {
        this.status = 'completed';
        this.aiAgentResponse = aiResponse;
        this.updatedAt = new Date();
    }

    markAsRequiresReview(reason = null) {
        this.status = 'requires_review';
        if (reason) {
            this.aiAgentResponse = { error: reason };
        }
        this.updatedAt = new Date();
    }

    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            institutionId: this.institutionId,
            firstName: this.firstName,
            lastName: this.lastName,
            maidenName: this.maidenName,
            dateOfBirth: this.dateOfBirth,
            courseName: this.courseName,
            fieldOfStudy: this.courseName,
            degreeType: this.degreeType,
            classification: this.classification,
            graduationYear: this.graduationYear,
            studentId: this.studentId,
            additionalNotes: this.additionalNotes,
            consentAgreement: this.consentAgreement,
            certificateFile: this.certificateFile,
            consentFile: this.consentFile,
            fee: this.fee,
            referenceNumber: this.referenceNumber,
            status: this.status,
            process: this.process,
            aiAgentResponse: this.aiAgentResponse,
            processingStartedAt: this.processingStartedAt,
            processingEndedAt: this.processingEndedAt,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            // Derived properties for convenience
            fullName: this.fullName,
            displayName: this.displayName,
            isPending: this.isPending,
            isProcessing: this.isProcessing,
            isCompleted: this.isCompleted,
            requiresReview: this.requiresReview
        };
    }

    // For database operations
    toDatabaseJSON() {
        const json = this.toJSON();
        // Remove derived properties for database
        delete json.fullName;
        delete json.displayName;
        delete json.isPending;
        delete json.isProcessing;
        delete json.isCompleted;
        delete json.requiresReview;
        return json;
    }
}

module.exports = Verification;