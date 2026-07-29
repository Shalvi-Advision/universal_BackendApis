const Razorpay = require('razorpay');
const crypto = require('crypto');

const { getRazorpayCredentials } = require('./tenantIntegrations');

// Razorpay access, resolved per tenant.
//
// The client used to be a single module-level instance built from process.env
// at import time, so every tenant's payments went to one merchant account and
// signatures were always checked against one secret. Clients are now built per
// request from the tenant's own key pair and cached by key id.

const clientCache = new Map();

const getClient = async (project) => {
  const { keyId, keySecret, source, projectCode } = await getRazorpayCredentials(project);

  if (!keyId || !keySecret) {
    const error = new Error(
      `Razorpay is not configured for project ${projectCode || '(unknown)'}`
    );
    error.statusCode = 503;
    throw error;
  }

  if (!clientCache.has(keyId)) {
    clientCache.set(keyId, new Razorpay({ key_id: keyId, key_secret: keySecret }));
  }

  return { client: clientCache.get(keyId), keyId, keySecret, source };
};

/**
 * Verify a Razorpay checkout signature against the tenant's own key secret.
 *
 * Uses a timing-safe comparison — a plain === on hex digests leaks match
 * position through timing.
 *
 * @returns {Promise<boolean>}
 */
const verifySignature = async (
  { razorpay_order_id, razorpay_payment_id, razorpay_signature },
  project
) => {
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return false;
  }

  const { keySecret } = await getClient(project);

  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  const provided = String(razorpay_signature);
  if (expected.length !== provided.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
};

/**
 * Fetch a payment from Razorpay. Used to confirm the amount and captured state
 * server-side rather than trusting what the client reports.
 */
const fetchPayment = async (paymentId, project) => {
  const { client } = await getClient(project);
  return client.payments.fetch(paymentId);
};

const createOrder = async (options, project) => {
  const { client } = await getClient(project);
  return client.orders.create(options);
};

const clearClientCache = () => clientCache.clear();

module.exports = {
  getClient,
  verifySignature,
  fetchPayment,
  createOrder,
  clearClientCache,
};
