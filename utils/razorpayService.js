const Razorpay = require('razorpay');
const crypto = require('crypto');

const { getRazorpayCredentials } = require('./tenantIntegrations');

// Razorpay access, resolved per tenant.
//
// The client used to be a single module-level instance built from process.env
// at import time, so every tenant's payments went to one merchant account and
// signatures were always checked against one secret. Clients are now built per
// request from the tenant's own key pair and cached by key id.

// Cached by key id AND a digest of the secret.
//
// Keying on the id alone meant a client built once was reused for the life of
// the process, so rotating a tenant's key_secret — in the admin panel, or by
// correcting a bad one — had no effect until someone restarted the API. Every
// order kept being signed with the superseded secret and Razorpay answered
// "Authentication failed", while the stored credentials looked perfectly
// correct to anyone who went and read them.
//
// The digest, not the secret, is the cache key: this map is process-global and
// long-lived, and there is no reason for it to hold plaintext credentials.
const clientCache = new Map();

const cacheKey = (keyId, keySecret) =>
  `${keyId}:${crypto.createHash('sha256').update(keySecret).digest('hex').slice(0, 16)}`;

const getClient = async (project) => {
  const { keyId, keySecret, source, projectCode } = await getRazorpayCredentials(project);

  if (!keyId || !keySecret) {
    const error = new Error(
      `Razorpay is not configured for project ${projectCode || '(unknown)'}`
    );
    error.statusCode = 503;
    throw error;
  }

  const key = cacheKey(keyId, keySecret);
  if (!clientCache.has(key)) {
    clientCache.set(key, new Razorpay({ key_id: keyId, key_secret: keySecret }));
  }

  return { client: clientCache.get(key), keyId, keySecret, source };
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
