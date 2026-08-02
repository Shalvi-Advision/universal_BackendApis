// utils/refreshTokenPolicy.js
//
// The decision half of refresh-token rotation, kept pure so it can be tested
// without a database — the rest of the controller is I/O.
//
// Rotation previously deleted the spent token in the same operation that issued
// its replacement. The old token was therefore dead the moment the server
// answered, before any client could have stored the new one. A client that lost
// that response held a token the server had already destroyed, its next refresh
// was rejected, and the app reads a rejected refresh as "session over" — so the
// shopper was signed out with no action of their own.
//
// The Razorpay checkout is where this shows up: it backgrounds the app for the
// length of a bank OTP, which is exactly when a response goes missing or a
// suspended process fails to finish its write.

/** Outcomes of inspecting a presented refresh token. */
const REFRESH_VERDICT = {
  /** No such token on the account — never issued, already logged out, or pruned. */
  ABSENT: 'absent',
  /** Past its own expiry. */
  EXPIRED: 'expired',
  /** Rotated away long enough ago that a well-behaved client cannot still hold it. */
  REUSE: 'reuse',
  /** Rotated away just now — a legitimate retry after a lost response. */
  RETRY: 'retry',
  /** Live and unspent: rotate it. */
  ROTATE: 'rotate',
};

/**
 * Decide what to do with a presented refresh token.
 *
 * @param {object|null|undefined} stored  The matching `refreshTokens` entry, if any.
 * @param {Date} now                      Current time, injected so this is testable.
 * @param {number} graceMs                How long a rotated token keeps working.
 * @returns {string} one of [REFRESH_VERDICT].
 */
const classifyRefreshToken = (stored, now, graceMs) => {
  if (!stored) return REFRESH_VERDICT.ABSENT;

  // Expiry outranks everything: a token past its own lifetime is finished
  // whether or not it was ever rotated.
  if (new Date(stored.expiresAt).getTime() <= now.getTime()) {
    return REFRESH_VERDICT.EXPIRED;
  }

  if (!stored.supersededAt) return REFRESH_VERDICT.ROTATE;

  const age = now.getTime() - new Date(stored.supersededAt).getTime();

  // A negative age means the entry claims to have been rotated in the future —
  // clock skew between app servers, or a tampered record. Treat it as reuse
  // rather than handing out a pair on the strength of an impossible timestamp.
  if (age < 0) return REFRESH_VERDICT.REUSE;

  return age <= graceMs ? REFRESH_VERDICT.RETRY : REFRESH_VERDICT.REUSE;
};

module.exports = { classifyRefreshToken, REFRESH_VERDICT };
