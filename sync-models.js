// sync-models.js

const { sequelize } = require('./src/infrastructure/database/models');

async function syncModels() {
  try {
    console.log('🔄 Syncing models...');
    
    // Use alter: true to sync without dropping data
    await sequelize.sync({ alter: true });
    
    console.log('✅ Models synced successfully');
    
  } catch (error) {
    console.error('❌ Error syncing models:', error);
  } finally {
    await sequelize.close();
  }
}

syncModels();