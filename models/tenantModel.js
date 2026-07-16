const { registerSchema, getTenantConnection } = require('../config/tenantContext');

// Wraps a schema in a proxy that resolves to the model compiled on the
// current tenant's connection at call time. Existing code keeps working
// unchanged: `Cart.find(...)`, `new Cart(...)`, schema statics and hooks all
// dispatch against the DB selected by the tenant middleware for this request.
module.exports = function tenantModel(name, schema) {
  registerSchema(name, schema);

  const resolveModel = () => {
    const connection = getTenantConnection();
    return connection.models[name] || connection.model(name, schema);
  };

  return new Proxy(class {}, {
    get(target, prop) {
      const model = resolveModel();
      const value = model[prop];
      return typeof value === 'function' ? value.bind(model) : value;
    },
    construct(target, args) {
      const Model = resolveModel();
      return new Model(...args);
    },
    getPrototypeOf() {
      return resolveModel();
    },
    has(target, prop) {
      return prop in resolveModel();
    },
  });
};
