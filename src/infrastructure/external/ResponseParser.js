class ResponseParser {
    static parseApiResponse(apiResponse, verificationData) {
        const result = {
            data: {},
            scores: {},
            flags: [],
            isComplete: false
        };

        // Parse based on common API response formats
        if (apiResponse.verificationStatus) {
            result.data.studentVerified = apiResponse.verificationStatus === 'verified';
            result.data.verificationDate = new Date().toISOString();
        }

        if (apiResponse.studentData) {
            result.data = { ...result.data, ...apiResponse.studentData };
        }

        // Calculate scores
        result.scores = this.calculateScores(result.data, verificationData);

        // Check for discrepancies
        result.flags = this.checkDiscrepancies(result.data, verificationData);

        result.isComplete = result.data.studentVerified !== undefined;

        return result;
    }

    static calculateScores(institutionData, verificationData) {
        let score = 0;
        let matchedFields = 0;
        const totalFields = 6; // Adjust based on your fields

        if (institutionData.firstName === verificationData.firstName) {
            score += 20;
            matchedFields++;
        }
        if (institutionData.lastName === verificationData.lastName) {
            score += 20;
            matchedFields++;
        }
        if (institutionData.studentId === verificationData.studentId) {
            score += 25;
            matchedFields++;
        }
        if (institutionData.dateOfBirth === verificationData.dateOfBirth) {
            score += 15;
            matchedFields++;
        }
        if (institutionData.courseName === verificationData.courseName) {
            score += 10;
            matchedFields++;
        }
        if (institutionData.graduationYear === verificationData.graduationYear) {
            score += 10;
            matchedFields++;
        }

        return {
            verificationScore: score,
            confidenceScore: Math.min(score + 10, 100),
            dataQualityScore: 90,
            completenessScore: (matchedFields / totalFields) * 100,
            timelinessScore: 95
        };
    }

    static checkDiscrepancies(institutionData, verificationData) {
        const flags = [];
        
        if (institutionData.firstName !== verificationData.firstName) {
            flags.push('name_mismatch');
        }
        if (institutionData.studentId !== verificationData.studentId) {
            flags.push('id_mismatch');
        }
        if (institutionData.dateOfBirth !== verificationData.dateOfBirth) {
            flags.push('dob_mismatch');
        }

        return flags;
    }
}

module.exports = ResponseParser;