const { AsyncLocalStorage } = require('async_hooks');

// Per-request tenant context. The tenant middleware runs each request inside
// als.run({ connection, project }), so any code on that async path (routes,
// services, model proxies) can resolve the correct tenant DB without passing
// it around explicitly.
const als = new AsyncLocalStorage();

// Every schema declared through models/tenantModel.js registers itself here so
// it can be compiled on each tenant connection on first use.
const schemaRegistry = new Map();

// Tracks which logical DBs already had the full registry compiled.
const compiledDbs = new Set();

// database.js injects this so code running outside a request (startup,
// scripts, socket handshake) still resolves to the default tenant DB.
let fallbackResolver = null;

function registerSchema(name, schema) {
  schemaRegistry.set(name, schema);
}

function setFallbackResolver(fn) {
  fallbackResolver = fn;
}

function getTenantConnection() {
  const store = als.getStore();
  if (store && store.connection) {
    return store.connection;
  }
  if (fallbackResolver) {
    return fallbackResolver();
  }
  throw new Error(
    'No tenant context active and no default database configured. ' +
    'Set DEFAULT_PROJECT_CODE / DEFAULT_DB_NAME or run within the tenant middleware.'
  );
}

function getTenantProject() {
  return als.getStore()?.project || null;
}

// Compile every registered schema on the given connection exactly once, so
// populate() and cross-model statics never hit MissingSchemaError.
function compileModels(connection) {
  if (compiledDbs.has(connection.name)) {
    return;
  }
  for (const [name, schema] of schemaRegistry) {
    if (!connection.models[name]) {
      connection.model(name, schema);
    }
  }
  compiledDbs.add(connection.name);
}

module.exports = {
  als,
  registerSchema,
  setFallbackResolver,
  getTenantConnection,
  getTenantProject,
  compileModels,
};
