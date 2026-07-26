// tests/home-feed.test.js
//
// Layout rules for the home feed. Runs with plain `node tests/home-feed.test.js`
// — no database, because assembleFeed is pure over already-fetched documents.
//
// What matters here is parity: the app currently hardcodes this order, so the
// feed has to reproduce it exactly or switching the app onto it is a visible
// regression.

const assert = require('assert');
const { assembleFeed, SECTION_TYPES } = require('../utils/homeFeedService');

const popularSection = (sequence) => ({
  _id: `popular-${sequence}`,
  sequence,
  title: `Popular ${sequence}`,
  description: '',
  background_color: '#FFFFFF',
  subcategories: [{ sub_category_id: `s${sequence}`, image_link: 'https://cdn/x.png' }],
});

const bestSellerSection = (sequence) => ({
  _id: `best-${sequence}`,
  sequence,
  title: `Best ${sequence}`,
  products: [{ p_code: `p${sequence}`, product_details: { p_code: `p${sequence}` } }],
});

const seasonalSection = (sequence) => ({
  _id: `seasonal-${sequence}`,
  sequence,
  title: `Seasonal ${sequence}`,
  subcategories: [{ sub_category_id: 's9' }],
});

const heroSection = {
  id: 'home_top',
  type: SECTION_TYPES.HERO_CAROUSEL,
  source: { sequence: 0 },
  title: '',
  description: '',
  style: {},
  personalized: false,
  items: [{ image_url: 'https://cdn/banner.png' }],
};

const fullFeed = () =>
  assembleFeed({
    popular: [1, 2, 3, 4, 5].map(popularSection),
    bestSellers: [1, 2, 3, 4].map(bestSellerSection),
    seasonal: [seasonalSection(1)],
    hero: heroSection,
  });

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

// ----------------------------------------------------------------------

test('reproduces the order the app currently hardcodes', () => {
  const types = fullFeed().map((s) => s.type);

  assert.deepStrictEqual(types, [
    SECTION_TYPES.CATEGORY_STRIP, // popular sequence 1
    SECTION_TYPES.HERO_CAROUSEL, // banners home_top
    SECTION_TYPES.CATEGORY_GRID, // popular 2
    SECTION_TYPES.PRODUCT_RAIL, // best seller 1
    SECTION_TYPES.OFFER_STRIP, // offer slot 0
    SECTION_TYPES.CATEGORY_GRID, // popular 3
    SECTION_TYPES.PRODUCT_RAIL, // best seller 2
    SECTION_TYPES.OFFER_STRIP,
    SECTION_TYPES.CATEGORY_GRID, // popular 4
    SECTION_TYPES.PRODUCT_RAIL, // best seller 3
    SECTION_TYPES.OFFER_STRIP,
    SECTION_TYPES.CATEGORY_GRID, // popular 5
    SECTION_TYPES.PRODUCT_RAIL, // best seller 4
    SECTION_TYPES.OFFER_STRIP,
    SECTION_TYPES.SEASONAL_PICKS,
  ]);
});

test('slots are contiguous and start at zero', () => {
  const slots = fullFeed().map((s) => s.slot);
  assert.deepStrictEqual(slots, slots.map((_, i) => i));
});

test('every section carries a stable id for analytics attribution', () => {
  const ids = fullFeed().map((s) => s.id);
  assert.ok(ids.every((id) => typeof id === 'string' && id.length > 0));
  assert.strictEqual(new Set(ids).size, ids.length, 'ids must be unique');
});

test('offer slots are personalized placeholders carrying no items', () => {
  const offers = fullFeed().filter((s) => s.type === SECTION_TYPES.OFFER_STRIP);

  assert.strictEqual(offers.length, 4);
  assert.ok(offers.every((s) => s.personalized === true));
  assert.ok(
    offers.every((s) => s.items.length === 0),
    'a personalized section must not leak server-side items'
  );
});

test('content sections are not marked personalized', () => {
  const content = fullFeed().filter((s) => s.type !== SECTION_TYPES.OFFER_STRIP);
  assert.ok(content.every((s) => s.personalized === false));
});

test('sections address their source by sequence', () => {
  const feed = fullFeed();
  const grids = feed.filter((s) => s.type === SECTION_TYPES.CATEGORY_GRID);
  assert.deepStrictEqual(grids.map((s) => s.source.sequence), [2, 3, 4, 5]);

  const rails = feed.filter((s) => s.type === SECTION_TYPES.PRODUCT_RAIL);
  assert.deepStrictEqual(rails.map((s) => s.source.sequence), [1, 2, 3, 4]);
});

test('items survive assembly', () => {
  const feed = fullFeed();
  const strip = feed.find((s) => s.type === SECTION_TYPES.CATEGORY_STRIP);
  assert.strictEqual(strip.items.length, 1);

  const rail = feed.find((s) => s.type === SECTION_TYPES.PRODUCT_RAIL);
  assert.strictEqual(rail.items[0].p_code, 'p1');
});

test('a missing section is skipped, not rendered empty', () => {
  // Tenant configured only popular 1 and 3, one best seller, no banners.
  const feed = assembleFeed({
    popular: [popularSection(1), popularSection(3)],
    bestSellers: [bestSellerSection(1)],
    seasonal: [],
    hero: null,
  });

  const types = feed.map((s) => s.type);
  assert.ok(!types.includes(SECTION_TYPES.HERO_CAROUSEL));
  assert.ok(!types.includes(SECTION_TYPES.SEASONAL_PICKS));
  assert.strictEqual(
    types.filter((t) => t === SECTION_TYPES.CATEGORY_GRID).length,
    1,
    'only popular 3 should produce a grid'
  );
  assert.strictEqual(types.filter((t) => t === SECTION_TYPES.PRODUCT_RAIL).length, 1);
});

test('an unconfigured tenant still yields a valid, offer-only feed', () => {
  const feed = assembleFeed({});
  assert.ok(feed.every((s) => s.type === SECTION_TYPES.OFFER_STRIP));
  assert.deepStrictEqual(feed.map((s) => s.slot), [0, 1, 2, 3]);
});

test('background colour and title reach the client', () => {
  const strip = fullFeed().find((s) => s.type === SECTION_TYPES.CATEGORY_STRIP);
  assert.strictEqual(strip.title, 'Popular 1');
  assert.strictEqual(strip.style.background_color, '#FFFFFF');
});

// ----------------------------------------------------------------------

let failed = 0;
tests.forEach(([name, fn]) => {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`  ✗ ${name}\n    ${error.message}`);
  }
});

console.log(`\n${tests.length - failed}/${tests.length} passed`);
process.exit(failed === 0 ? 0 : 1);
