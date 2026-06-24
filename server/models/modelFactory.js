const mongoose = require('mongoose');
const createLocalModel = require('./localModel');

function shouldUseLocalDb() {
  return process.env.USE_LOCAL_DB === 'true' || process.env.USE_LOCAL_DB === '1';
}

function createModel(modelName, schema, defaults = {}) {
  if (shouldUseLocalDb()) {
    return createLocalModel(modelName, defaults);
  }

  return mongoose.model(modelName, schema);
}

module.exports = createModel;
