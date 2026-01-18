'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // First, get some existing IDs to use as foreign keys
        const [verifications] = await queryInterface.sequelize.query(
            `SELECT id, "institutionId" FROM verifications LIMIT 5`
        );

        const [users] = await queryInterface.sequelize.query(
            `SELECT id FROM users WHERE role IN ('admin', 'member') LIMIT 3`
        );

        const [institutions] = await queryInterface.sequelize.query(
            `SELECT id, name FROM institutions LIMIT 3`
        );

        if (verifications.length === 0) {
            console.log('No verifications found. Please run verifications seeder first.');
            return;
        }

        if (users.length === 0) {
            console.log('No users found. Please run users seeder first.');
            return;
        }

        if (institutions.length === 0) {
            console.log('No institutions found. Please run institutions seeder first.');
            return;
        }

        const institutionResponses = [
            // Type 1: API Connection - Successful auto response
            // {
            //     id: '11111111-1111-1111-1111-111111111111',
            //     verificationId: verifications[0]?.id,
            //     institutionId: institutions.find(i => i.connectionType === 'api')?.id || institutions[0].id,
            //     requestId: 'API-REQ-001',
            //     responseData: JSON.stringify({
            //         studentVerified: true,
            //         graduationDate: '2023-06-15',
            //         degree: 'Bachelor of Science',
            //         major: 'Computer Science',
            //         gpa: 3.8,
            //         enrollmentStatus: 'graduated',
            //         dataPoints: {
            //             name: JSON.stringify({ match: true, confidence: 98 }),  // Stringify inner objects
            //             dob: JSON.stringify({ match: true, confidence: 95 }),
            //             studentId: JSON.stringify({ match: true, confidence: 100 })
            //         }
            //     }),
            //     verificationScore: 95,
            //     status: 'completed',
            //     responseType: 'api_auto',
            //     processedBy: users[0]?.id,
            //     processedAt: new Date(Date.now() - 86400000), // 1 day ago
            //     rawResponse: null,
            //     confidenceScore: 92,
            //     flags: '{}',
            //     metadata: JSON.stringify({
            //         apiEndpoint: 'https://university-api.example.com/verify',
            //         apiVersion: 'v2.1',
            //         processingTime: 1250,
            //         retries: 0,
            //         assignedBy: users[1]?.id
            //     }),
            //     responseTime: 1250,
            //     apiVersion: 'v2.1',
            //     dataSource: 'university_student_database',
            //     verificationDate: new Date(Date.now() - 86400000),
            //     expiryDate: new Date(Date.now() + 365 * 86400000), // 1 year from now
            //     cost: 15.50,
            //     currency: 'USD',
            //     notes: 'Automatic API verification successful',
            //     attachments: JSON.stringify([
            //         'https://storage.example.com/certificates/12345.pdf',
            //         'https://storage.example.com/transcripts/12345.pdf'
            //     ]),
            //     isVerified: true,
            //     verificationMethod: 'database_lookup',
            //     dataQualityScore: 94,
            //     completenessScore: 96,
            //     timelinessScore: 98,
            //     createdAt: new Date(Date.now() - 2 * 86400000), // 2 days ago
            //     updatedAt: new Date(Date.now() - 86400000)
            // },

              // Type 1: API Connection - Pending manual processing
            //   {
            //     id: '22222222-2222-2222-2222-222222222222',
            //     verificationId: verifications[1]?.id,
            //     institutionId: institutions.find(i => i.connectionType === 'api')?.id || institutions[0].id,
            //     requestId: 'API-REQ-002',
            //     responseData: '{}',
            //     verificationScore: 0,
            //     status: 'pending',
            //     responseType: 'api_manual',
            //     processedBy: null,
            //     processedAt: null,
            //     rawResponse: null,
            //     confidenceScore: 0,
            //     flags: '{}',
            //     metadata: JSON.stringify({
            //       assignedBy: users[0]?.id,
            //       assignedAt: new Date(Date.now() - 43200000), // 12 hours ago
            //       institutionNotes: 'Requires manual API call due to data discrepancy'
            //     }),
            //     responseTime: null,
            //     apiVersion: null,
            //     dataSource: null,
            //     verificationDate: null,
            //     expiryDate: null,
            //     cost: null,
            //     currency: 'USD',
            //     notes: 'Waiting for staff to process via API',
            //     attachments: null,
            //     isVerified: false,
            //     verificationMethod: null,
            //     dataQualityScore: null,
            //     completenessScore: null,
            //     timelinessScore: null,
            //     createdAt: new Date(Date.now() - 43200000),
            //     updatedAt: new Date(Date.now() - 43200000)
            //   },

              // Type 2: Web Interface - Completed manual entry
              {
                id: '33333333-3333-3333-3333-333333333333',
                verificationId: verifications[2]?.id,
                institutionId: institutions.find(i => i.connectionType === 'web_interface')?.id || institutions[1].id,
                requestId: 'WEB-REQ-001',
                responseData: {
                  verifiedBy: 'Dr. Jane Smith',
                  position: 'Registrar',
                  contactEmail: 'registrar@university.edu',
                  verificationMethod: 'manual_records_check',
                  findings: {
                    studentExists: true,
                    recordStatus: 'active',
                    lastEnrollment: 'Spring 2023',
                    remarks: 'All records verified. Degree confirmed.'
                  },
                  documents: [
                    { type: 'transcript', verified: true },
                    { type: 'degree_certificate', verified: true }
                  ]
                },
                verificationScore: 88,
                status: 'completed',
                responseType: 'manual',
                processedBy: users[2]?.id,
                processedAt: new Date(Date.now() - 172800000), // 2 days ago
                rawResponse: null,
                confidenceScore: 85,
                flags: ['requires_additional_document'],
                metadata: {
                  entryMethod: 'web_portal',
                  entryDuration: 450, // seconds
                  ipAddress: '192.168.1.100',
                  browser: 'Chrome 118',
                  universityStaffId: 'USTF-78901'
                },
                responseTime: 450000, // 7.5 minutes in milliseconds
                apiVersion: null,
                dataSource: 'manual_records',
                verificationDate: new Date(Date.now() - 172800000),
                expiryDate: new Date(Date.now() + 180 * 86400000), // 6 months
                cost: 25.00,
                currency: 'EUR',
                notes: 'Verified by university staff. Minor discrepancy in middle name spelling.',
                attachments: [
                  'https://storage.example.com/signed-verifications/789.pdf'
                ],
                isVerified: true,
                verificationMethod: 'manual_verification',
                dataQualityScore: 82,
                completenessScore: 90,
                timelinessScore: 76,
                createdAt: new Date(Date.now() - 3 * 86400000), // 3 days ago
                updatedAt: new Date(Date.now() - 172800000)
              },

            //   // Type 2: Web Interface - Requires Review
            //   {
            //     id: '44444444-4444-4444-4444-444444444444',
            //     verificationId: verifications[3]?.id,
            //     institutionId: institutions.find(i => i.connectionType === 'web_interface')?.id || institutions[1].id,
            //     requestId: 'WEB-REQ-002',
            //     responseData: JSON.stringify({
            //       verifiedBy: 'John Doe',
            //       position: 'Admissions Officer',
            //       contactEmail: 'admissions@college.edu',
            //       verificationMethod: 'partial_check',
            //       findings: {
            //         studentExists: true,
            //         recordStatus: 'incomplete',
            //         remarks: 'Missing graduation date in records'
            //       }
            //     }),
            //     verificationScore: 65,
            //     status: 'requires_review',
            //     responseType: 'manual',
            //     processedBy: users[1]?.id,
            //     processedAt: new Date(Date.now() - 86400000),
            //     rawResponse: null,
            //     confidenceScore: 60,
            //     flags: ['missing_data', 'date_discrepancy'],
            //     metadata: JSON.stringify({
            //       entryMethod: 'web_portal',
            //       entryDuration: 320,
            //       ipAddress: '10.0.0.50',
            //       reviewerNotes: 'Need to contact registrar for complete records'
            //     }),
            //     responseTime: 320000,
            //     apiVersion: null,
            //     dataSource: 'partial_records',
            //     verificationDate: new Date(Date.now() - 86400000),
            //     expiryDate: null,
            //     cost: 10.00,
            //     currency: 'USD',
            //     notes: 'Partial verification. Graduation date needs confirmation.',
            //     attachments: '[]::jsonb',
            //     isVerified: false,
            //     verificationMethod: 'partial_verification',
            //     dataQualityScore: 70,
            //     completenessScore: 65,
            //     timelinessScore: 88,
            //     createdAt: new Date(Date.now() - 5 * 86400000),
            //     updatedAt: new Date(Date.now() - 86400000)
            //   },

            //   // Failed API Response
            //   {
            //     id: '55555555-5555-5555-5555-555555555555',
            //     verificationId: verifications[4]?.id,
            //     institutionId: institutions.find(i => i.connectionType === 'api')?.id || institutions[0].id,
            //     requestId: 'API-REQ-003',
            //     responseData: JSON.stringify({}),
            //     verificationScore: 0,
            //     status: 'failed',
            //     responseType: 'api_manual',
            //     processedBy: users[0]?.id,
            //     processedAt: new Date(Date.now() - 21600000), // 6 hours ago
            //     rawResponse: '{"error": "Connection timeout", "code": 504}',
            //     confidenceScore: 0,
            //     flags: ['api_error', 'connection_failed'],
            //     metadata: JSON.stringify({
            //       apiEndpoint: 'https://old-university-api.example.com/verify',
            //       attemptCount: 3,
            //       lastError: 'Connection timeout after 30 seconds',
            //       retryScheduled: new Date(Date.now() + 3600000) // 1 hour from now
            //     }),
            //     responseTime: 30000,
            //     apiVersion: 'v1.0',
            //     dataSource: null,
            //     verificationDate: null,
            //     expiryDate: null,
            //     cost: null,
            //     currency: 'USD',
            //     notes: 'API connection failed multiple times. Institution API seems down.',
            //     attachments: '[]::jsonb',
            //     isVerified: false,
            //     verificationMethod: null,
            //     dataQualityScore: null,
            //     completenessScore: null,
            //     timelinessScore: null,
            //     createdAt: new Date(Date.now() - 86400000),
            //     updatedAt: new Date(Date.now() - 21600000)
            //   },

            //   // Processing status (currently being handled)
            //   {
            //     id: '66666666-6666-6666-6666-666666666666',
            //     verificationId: verifications[0]?.id || verifications[1]?.id,
            //     institutionId: institutions[2]?.id || institutions[0].id,
            //     requestId: 'API-REQ-004',
            //     responseData: JSON.stringify({}),
            //     verificationScore: 0,
            //     status: 'processing',
            //     responseType: 'api_auto',
            //     processedBy: users[0]?.id,
            //     processedAt: null,
            //     rawResponse: null,
            //     confidenceScore: 0,
            //     flags: '[]::jsonb',
            //     metadata: JSON.stringify({
            //       apiCallStartedAt: new Date(),
            //       estimatedCompletion: new Date(Date.now() + 300000), // 5 minutes from now
            //       currentStep: 'fetching_student_data'
            //     }),
            //     responseTime: null,
            //     apiVersion: 'v2.0',
            //     dataSource: null,
            //     verificationDate: null,
            //     expiryDate: null,
            //     cost: null,
            //     currency: 'USD',
            //     notes: 'API call in progress...',
            //     attachments: '[]::jsonb',
            //     isVerified: false,
            //     verificationMethod: null,
            //     dataQualityScore: null,
            //     completenessScore: null,
            //     timelinessScore: null,
            //     createdAt: new Date(Date.now() - 1800000), // 30 minutes ago
            //     updatedAt: new Date()
            //   } 
            {}
        ].filter(ir => ir.verificationId && ir.institutionId); // Filter out any without required FKs

        // Insert the data
        await queryInterface.bulkInsert('institutionresponses', institutionResponses, {});

        console.log(`Inserted ${institutionResponses.length} institution response records`);
    },

    down: async (queryInterface, Sequelize) => {
        // Remove all seeded data
        await queryInterface.bulkDelete('institutionresponses', null, {});

        console.log('Removed all seeded institution responses');
    }
};