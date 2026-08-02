// tests/refresh-token-policy.test.js
//
// Runs with plain `node tests/refresh-token-policy.test.js` — no database,
// because classifyRefreshToken is pure over an already-loaded entry.
//
// What is being pinned: rotation used to delete the spent token in the same
// operation that issued its replacement, so the old one died before any client
// could have stored the new one. A dropped response therefore left the device
// holding a token the server had already destroyed, its next refresh was
// rejected, and the app reads a rejected refresh as a sign-out. The Razorpay
// checkout made this reachable in normal use: it backgrounds the app for the
// length of a bank OTP.

const assert = require('assert');
const {
  classifyRefreshToken,
  REFRESH_VERDICT,
} = require('../utils/refreshTokenPolicy');

const NOW = new Date('2026-08-02T12:00:00.000Z');
const GRACE_MS = 60_000;

const entry = (overrides = {}) => ({
  tokenHash: 'hash',
  expiresAt: new Date(NOW.getTime() + 90 * 24 * 60 * 60 * 1000),
  supersededAt: null,
  device: 'pixel',
  ...overrides,
});

const ago = (ms) => new Date(NOW.getTime() - ms);

const tests = {
  'an unknown token is absent'() {
    assert.strictEqual(
      classifyRefreshToken(null, NOW, GRACE_MS),
      REFRESH_VERDICT.ABSENT
    );
    assert.strictEqual(
      classifyRefreshToken(undefined, NOW, GRACE_MS),
      REFRESH_VERDICT.ABSENT
    );
  },

  'a live unspent token rotates'() {
    assert.strictEqual(
      classifyRefreshToken(entry(), NOW, GRACE_MS),
      REFRESH_VERDICT.ROTATE
    );
  },

  'a token past its own expiry is expired'() {
    assert.strictEqual(
      classifyRefreshToken(entry({ expiresAt: ago(1) }), NOW, GRACE_MS),
      REFRESH_VERDICT.EXPIRED
    );
  },

  'expiry outranks the grace window'() {
    // Rotated a moment ago but also past its lifetime: finished either way.
    assert.strictEqual(
      classifyRefreshToken(
        entry({ expiresAt: ago(1), supersededAt: ago(1_000) }),
        NOW,
        GRACE_MS
      ),
      REFRESH_VERDICT.EXPIRED
    );
  },

  'a retry moments after rotation is honoured'() {
    // The case that was signing shoppers out: the client never stored the pair
    // it was sent and is asking again with what it still has.
    assert.strictEqual(
      classifyRefreshToken(entry({ supersededAt: ago(1_500) }), NOW, GRACE_MS),
      REFRESH_VERDICT.RETRY
    );
  },

  'a retry exactly on the grace boundary is honoured'() {
    assert.strictEqual(
      classifyRefreshToken(entry({ supersededAt: ago(GRACE_MS) }), NOW, GRACE_MS),
      REFRESH_VERDICT.RETRY
    );
  },

  'a replay past the grace window is reuse'() {
    // A well-behaved client cannot still be presenting this — it has held the
    // replacement since. Callers respond by revoking every session.
    assert.strictEqual(
      classifyRefreshToken(entry({ supersededAt: ago(GRACE_MS + 1) }), NOW, GRACE_MS),
      REFRESH_VERDICT.REUSE
    );
  },

  'a replay long after rotation is reuse'() {
    assert.strictEqual(
      classifyRefreshToken(
        entry({ supersededAt: ago(6 * 60 * 60 * 1000) }),
        NOW,
        GRACE_MS
      ),
      REFRESH_VERDICT.REUSE
    );
  },

  'a rotation timestamped in the future is reuse, not a free pass'() {
    // Clock skew between app servers, or a tampered record. Handing out a pair
    // on the strength of an impossible timestamp is the wrong way to fail.
    assert.strictEqual(
      classifyRefreshToken(
        entry({ supersededAt: new Date(NOW.getTime() + 5_000) }),
        NOW,
        GRACE_MS
      ),
      REFRESH_VERDICT.REUSE
    );
  },

  'date strings are handled as well as Date objects'() {
    // Mongo hands these back as Dates, but lean()/JSON round-trips give strings.
    assert.strictEqual(
      classifyRefreshToken(
        entry({
          expiresAt: new Date(NOW.getTime() + 1000).toISOString(),
          supersededAt: ago(2_000).toISOString(),
        }),
        NOW,
        GRACE_MS
      ),
      REFRESH_VERDICT.RETRY
    );
  },

  'a zero grace window rejects every retry'() {
    assert.strictEqual(
      classifyRefreshToken(entry({ supersededAt: ago(1) }), NOW, 0),
      REFRESH_VERDICT.REUSE
    );
  },
};

let failed = 0;
for (const [name, fn] of Object.entries(tests)) {
  try {
    fn();
    console.log(`  ok  ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`  FAIL  ${name}`);
    console.error(`        ${error.message}`);
  }
}

const total = Object.keys(tests).length;
console.log(`\n${total - failed}/${total} passed`);
process.exit(failed === 0 ? 0 : 1);
