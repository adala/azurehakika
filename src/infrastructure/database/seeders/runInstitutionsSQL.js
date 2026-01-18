// infrastructure/database/seeders/runInstitutionsSQL.js

const fs = require('fs');
const path = require('path');
const sequelize  = require('../../../../config/database');

async function runSQLSeeder() {
    console.log('📊 Starting PostgreSQL institution seeder...');
    
    try {
        // Read the SQL file
        const sqlPath = path.join(__dirname, 'institutions_seed.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // Check if institutions already exist
        const [existingCount] = await sequelize.query(
            'SELECT COUNT(*) as count FROM institutions;',
            { type: sequelize.QueryTypes.SELECT }
        );
        
        if (existingCount.count > 0) {
            console.log(`⏩ Institutions already exist (${existingCount.count} records). Skipping seeding.`);
            return;
        }
        
        console.log('No institutions found, executing SQL script...');
        
        // Execute the SQL script
        await sequelize.query(sql);
        
        console.log('✅ Institutions seeded successfully!');
        
        // Verify the data
        const [institutions] = await sequelize.query(
            'SELECT code, name, country FROM institutions ORDER BY name;',
            { type: sequelize.QueryTypes.SELECT }
        );
        
        console.log(`📋 Total institutions: ${institutions.length}`);
        institutions.forEach(inst => {
            console.log(`   - ${inst.name} (${inst.code}) - ${inst.country}`);
        });
        
    } catch (error) {
        console.error('❌ Error seeding institutions:', error);
        throw error;
    } finally {
        await sequelize.close();
    }
}

// Run if called directly
if (require.main === module) {
    runSQLSeeder();
}

module.exports = runSQLSeeder;