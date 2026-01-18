'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const sequelize = require('../../../../config/database');
const db = {};

// Import models using require() - they are already instantiated
const Institution = require('./Institution');
const Verification = require('./Verification');

// Add models to db object
db.Institution = Institution;
db.Verification = Verification;

// Initialize associations if they exist
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;