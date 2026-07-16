const mongoose = require('mongoose');
const { setFallbackResolver, compileModels } = require('./tenantContext');

// One physical connection to the cluster; logical DB per tenant via useDb
// (shared socket pool, so 100 tenant DBs still cost one connection pool).
const CONTROL_DB_NAME = process.env.CONTROL_DB_NAME || 'Universal_Control';
const DEFAULT_DB_NAME = process.env.DEFAULT_DB_NAME || 'Pagariya_DB';

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set. Add it to your .env file.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Control DB: ${CONTROL_DB_NAME} | Default tenant DB: ${DEFAULT_DB_NAME}`);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Logical tenant DB on the shared connection. useCache reuses the Connection
// object per db name; compileModels makes all registered schemas available.
const getTenantDb = (dbName) => {
  const connection = mongoose.connection.useDb(dbName, { useCache: true });
  compileModels(connection);
  return connection;
};

const getControlDb = () => mongoose.connection.useDb(CONTROL_DB_NAME, { useCache: true });

// Code running outside a request (startup, scripts, socket auth) falls back
// to the default tenant DB.
setFallbackResolver(() => getTenantDb(DEFAULT_DB_NAME));

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB disconnected');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error.message);
  }
};

module.exports = {
  connectDB,
  disconnectDB,
  getTenantDb,
  getControlDb,
  mongoose,
  CONTROL_DB_NAME,
  DEFAULT_DB_NAME,
};
