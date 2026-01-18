// infrastructure/database/seeders/InstitutionSeeder.js

const { sequelize } = require('../../../../config/database');
const { DataTypes } = require('sequelize');

// Define the model directly in the seeder or import it correctly
const Institution = sequelize.define('Institution', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    country: {
        type: DataTypes.STRING,
        allowNull: false
    },
    // ... include all other fields from your model
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    foundingDate: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'founding_date'
    },
    numberOfEmployees: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'number_of_employees'
    },
    numberOfStudents: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'number_of_students'
    },
    legalName: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'legal_name'
    },
    logo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    parentOrganization: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'parent_organization'
    },
    website: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            isUrl: true
        }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            isEmail: true
        }
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    vfee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    process: {
        type: DataTypes.ENUM('auto', 'manual'),
        allowNull: false,
        defaultValue: 'manual'
    },
    processingTime: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'processing_time'
    },
    apiEndpoint: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'api_endpoint'
    },
    apiKey: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'api_key'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active'
    }
}, {
    tableName: 'institutions',
    timestamps: true,
    underscored: true
});

class InstitutionSeeder {
    async run() {
        console.log('Starting institution seeder...');

        const institutionsData = [
            {
                // Basic Identifiers
                name: "University of Ghana",
                code: "UG",
                type: "University",
                country: "Ghana",
                
                // Descriptive Fields
                description: "The premier university in Ghana, founded as the University College of the Gold Coast by Ordinance on August 11, 1948 for the purpose of providing and promoting university education, learning and research. The university aims to become a world-class research-intensive institution.",
                foundingDate: "1948",
                numberOfEmployees: 6565,
                numberOfStudents: 65000,
                legalName: null,
                logo: null,
                parentOrganization: null,
                
                // Contact Information
                website: "https://www.ug.edu.gh",
                email: null,
                phone: null,
                address: null,
                
                // Verification Process & Fees
                vfee: 15,
                process: "manual",
                processingTime: "10 days",
                apiEndpoint: "",
                apiKey: "",
                
                // System
                isActive: true
            },
            {
                name: "Kwame Nkrumah University of Science and Technology",
                code: "KNUST",
                type: "University",
                country: "Ghana",
                
                // Descriptive Fields
                description: null,
                foundingDate: null,
                numberOfEmployees: null,
                numberOfStudents: null,
                legalName: null,
                logo: null,
                parentOrganization: null,
                
                // Contact Information
                website: null,
                email: null,
                phone: null,
                address: null,
                
                // Verification Process & Fees
                vfee: 15,
                process: "manual",
                processingTime: "10 days",
                apiEndpoint: "",
                apiKey: "",
                
                // System
                isActive: true
            },
            {
                name: "University of Cape Coast",
                code: "UCC", 
                type: "University",
                country: "Ghana",
                
                // Descriptive Fields
                description: null,
                foundingDate: null,
                numberOfEmployees: null,
                numberOfStudents: null,
                legalName: null,
                logo: null,
                parentOrganization: null,
                
                // Contact Information
                website: null,
                email: null,
                phone: null,
                address: null,
                
                // Verification Process & Fees
                vfee: 15,
                process: "manual",
                processingTime: "10 days",
                apiEndpoint: "",
                apiKey: "",
                
                // System
                isActive: true
            },
            {
                name: "University of Winneba",
                code: "UW",
                type: "University", 
                country: "Ghana",
                
                // Descriptive Fields
                description: null,
                foundingDate: null,
                numberOfEmployees: null,
                numberOfStudents: null,
                legalName: null,
                logo: null,
                parentOrganization: null,
                
                // Contact Information
                website: null,
                email: null,
                phone: null,
                address: null,
                
                // Verification Process & Fees
                vfee: 15,
                process: "manual",
                processingTime: "10 days",
                apiEndpoint: "",
                apiKey: "",
                
                // System
                isActive: true
            },
            {
                name: "University of Mines and Technology",
                code: "UMaT",
                type: "University",
                country: "Ghana",
                
                // Descriptive Fields
                description: null,
                foundingDate: null,
                numberOfEmployees: null,
                numberOfStudents: null,
                legalName: null,
                logo: null,
                parentOrganization: null,
                
                // Contact Information
                website: null,
                email: null,
                phone: null,
                address: null,
                
                // Verification Process & Fees
                vfee: 15,
                process: "manual",
                processingTime: "10 days",
                apiEndpoint: "",
                apiKey: "",
                
                // System
                isActive: true
            }
        ];

        try {
            // Sync the model first to ensure table exists
            await Institution.sync();
            console.log('✅ Institutions table synced');

            const existingCount = await Institution.count();
            
            if (existingCount === 0) {
                console.log('No institutions found, creating seed data...');
                await Institution.bulkCreate(institutionsData);
                console.log(`✅ Successfully seeded ${institutionsData.length} institutions`);
            } else {
                console.log(`⏩ Institutions already exist (${existingCount} records). Skipping seeding.`);
            }

            return institutionsData;
        } catch (error) {
            console.error('❌ Error seeding institutions:', error);
            throw error;
        }
    }

    async clear() {
        try {
            await Institution.destroy({ where: {} });
            console.log('✅ All institutions deleted');
        } catch (error) {
            console.error('❌ Error clearing institutions:', error);
            throw error;
        }
    }
}

module.exports = InstitutionSeeder;