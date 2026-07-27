// tests/home-feed.test.js
//
// Layout rules for the home feed. Runs with plain `node tests/home-feed.test.js`
// — no database, because assembleFeed is pure over already-fetched documents.
//
// What matters here is parity: the app currently hardcodes this order, so the
// feed has to reproduce it exactly or switching the app onto it is a visible
// regression.

const assert = require('assert');
const {
  assembleFeed,
  assembleFromLayout,
  SECTION_TYPES,
  TOP_SELLER_SLOTS,
} = require('../utils/homeFeedService');

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

// The top_sellers collection spells its colour differently from every other
// collection, which is exactly what makes it worth a fixture of its own.
const topSellerSection = (sequence) => ({
  _id: `top-${sequence}`,
  sequence,
  title: `Top ${sequence}`,
  bg_color: '#ABCDEF',
  products: [{ p_code: `t${sequence}`, product_details: { p_code: `t${sequence}` } }],
});

const midSection = {
  id: 'home_middle',
  type: SECTION_TYPES.BANNER_STRIP,
  source: { sequence: 0, collection_name: 'banners' },
  title: '',
  description: '',
  style: {},
  personalized: false,
  items: [{ image_url: 'https://cdn/mid.png' }],
};

const adsSection = {
  id: 'advertisements-all',
  type: SECTION_TYPES.BANNER_STRIP,
  source: { sequence: 0, collection_name: 'advertisements' },
  title: '',
  description: '',
  style: {},
  personalized: false,
  items: [{ banner_url: 'https://cdn/ad.png' }],
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


// ---- Phase 2: admin-defined layout ----

const layoutEntry = (
  type,
  { sequence = null, collection = 'none', title = '', id, config = {} } = {}
) => ({
  _id: id || `layout-${type}-${sequence ?? 0}`,
  type,
  title,
  sequence: 0,
  source: { collection_name: collection, sequence },
  style: {},
  config,
});

test('layout order wins over the built-in arrangement', () => {
  const feed = assembleFromLayout({
    layout: [
      layoutEntry(SECTION_TYPES.PRODUCT_RAIL, { sequence: 1, collection: 'best_sellers' }),
      layoutEntry(SECTION_TYPES.CATEGORY_GRID, { sequence: 2, collection: 'popular_categories' }),
      layoutEntry(SECTION_TYPES.OFFER_STRIP),
    ],
    popular: [popularSection(2)],
    bestSellers: [bestSellerSection(1)],
  });

  assert.deepStrictEqual(feed.map((s) => s.type), [
    SECTION_TYPES.PRODUCT_RAIL,
    SECTION_TYPES.CATEGORY_GRID,
    SECTION_TYPES.OFFER_STRIP,
  ]);
  assert.deepStrictEqual(feed.map((s) => s.slot), [0, 1, 2]);
});

test('a layout title overrides the source document title', () => {
  const feed = assembleFromLayout({
    layout: [
      layoutEntry(SECTION_TYPES.CATEGORY_GRID, {
        sequence: 2,
        collection: 'popular_categories',
        title: 'Diwali picks',
      }),
    ],
    popular: [popularSection(2)],
  });

  assert.strictEqual(feed[0].title, 'Diwali picks');
});

test('an empty layout title falls back to the source document', () => {
  const feed = assembleFromLayout({
    layout: [layoutEntry(SECTION_TYPES.CATEGORY_GRID, { sequence: 2, collection: 'popular_categories' })],
    popular: [popularSection(2)],
  });

  assert.strictEqual(feed[0].title, 'Popular 2');
});

test('a section pointing at a deleted document is dropped', () => {
  const feed = assembleFromLayout({
    layout: [
      layoutEntry(SECTION_TYPES.CATEGORY_GRID, { sequence: 9, collection: 'popular_categories' }),
      layoutEntry(SECTION_TYPES.CATEGORY_GRID, { sequence: 2, collection: 'popular_categories' }),
    ],
    popular: [popularSection(2)],
  });

  assert.strictEqual(feed.length, 1, 'the dangling section must not render as an empty heading');
  assert.strictEqual(feed[0].source.sequence, 2);
});

test('a layout can point a product rail at top sellers', () => {
  const feed = assembleFromLayout({
    layout: [layoutEntry(SECTION_TYPES.PRODUCT_RAIL, { sequence: 1, collection: 'top_sellers' })],
    topSellers: [bestSellerSection(1)],
  });

  assert.strictEqual(feed.length, 1);
  assert.strictEqual(feed[0].items[0].p_code, 'p1');
});

test('personalized types stay empty however the layout places them', () => {
  const feed = assembleFromLayout({
    layout: [
      layoutEntry('buy_again'),
      layoutEntry('recently_viewed'),
      layoutEntry('free_delivery_progress'),
    ],
  });

  assert.strictEqual(feed.length, 3);
  assert.ok(feed.every((s) => s.personalized === true));
  assert.ok(feed.every((s) => s.items.length === 0));
});

test('the same layout repeats a type as many times as it likes', () => {
  const feed = assembleFromLayout({
    layout: [
      layoutEntry(SECTION_TYPES.PRODUCT_RAIL, { sequence: 1, collection: 'best_sellers', id: 'a' }),
      layoutEntry(SECTION_TYPES.PRODUCT_RAIL, { sequence: 2, collection: 'best_sellers', id: 'b' }),
    ],
    bestSellers: [bestSellerSection(1), bestSellerSection(2)],
  });

  assert.strictEqual(feed.length, 2);
  assert.deepStrictEqual(feed.map((s) => s.id), ['a', 'b']);
});

// ---- all six admin collections reach the home screen ----
//
// Each of these is a collection the panel has always been able to edit but
// whose content never appeared on the phone.

test('top sellers get their own rails in the default layout', () => {
  const feed = assembleFeed({
    popular: [1, 2, 3, 4, 5].map(popularSection),
    bestSellers: [1, 2, 3, 4].map(bestSellerSection),
    topSellers: [topSellerSection(1), topSellerSection(2)],
    seasonal: [seasonalSection(1)],
    hero: heroSection,
  });

  const rails = feed.filter((s) => s.source.collection_name === 'top_sellers');
  assert.strictEqual(rails.length, 2);
  // After the interleaved best-seller block, before seasonal picks.
  const lastBest = feed.map((s) => s.source.collection_name).lastIndexOf('best_sellers');
  assert.ok(feed.indexOf(rails[0]) > lastBest);
});

test('a top-seller rail with no products is not rendered empty', () => {
  const empty = { ...topSellerSection(1), products: [] };
  const feed = assembleFeed({ topSellers: [empty] });

  assert.strictEqual(feed.filter((s) => s.source.collection_name === 'top_sellers').length, 0);
});

test('only TOP_SELLER_SLOTS rails are drawn however many exist', () => {
  const feed = assembleFeed({
    topSellers: [1, 2, 3, 4, 5].map(topSellerSection),
  });

  assert.strictEqual(
    feed.filter((s) => s.source.collection_name === 'top_sellers').length,
    TOP_SELLER_SLOTS
  );
});

test("a top seller's bg_color reaches the client as background_color", () => {
  // The collection spells it bg_color; every other one uses background_color.
  const feed = assembleFeed({ topSellers: [topSellerSection(1)] });
  const rail = feed.find((s) => s.source.collection_name === 'top_sellers');

  assert.strictEqual(rail.style.background_color, '#ABCDEF');
});

test('product rails say which collection they came from', () => {
  // A best-seller rail and a top-seller rail can share a sequence, so the
  // client cannot tell them apart without this and would fetch the wrong one.
  const feed = assembleFeed({
    bestSellers: [bestSellerSection(1)],
    topSellers: [topSellerSection(1)],
  });

  const rails = feed.filter((s) => s.type === SECTION_TYPES.PRODUCT_RAIL);
  assert.deepStrictEqual(
    rails.map((s) => s.source.collection_name),
    ['best_sellers', 'top_sellers']
  );
  assert.strictEqual(rails[0].source.sequence, rails[1].source.sequence);
});

test('mid-page banners are placed between merchandising blocks', () => {
  const feed = assembleFeed({
    popular: [1, 2, 3, 4, 5].map(popularSection),
    bestSellers: [1, 2, 3, 4].map(bestSellerSection),
    hero: heroSection,
    mid: midSection,
  });

  const types = feed.map((s) => s.type);
  const midIndex = feed.findIndex((s) => s.id === 'home_middle');

  assert.ok(midIndex > types.indexOf(SECTION_TYPES.HERO_CAROUSEL));
  assert.strictEqual(feed[midIndex].type, SECTION_TYPES.BANNER_STRIP);
  // Exactly once, not once per interleaved pair.
  assert.strictEqual(feed.filter((s) => s.id === 'home_middle').length, 1);
});

test('a tenant with no mid-page banners is unaffected', () => {
  const withMid = assembleFeed({ popular: [popularSection(1)], mid: null });

  assert.strictEqual(withMid.filter((s) => s.type === SECTION_TYPES.BANNER_STRIP).length, 0);
});

test('advertisements appear as their own strip', () => {
  const feed = assembleFeed({ popular: [popularSection(1)], ads: adsSection });

  const strip = feed.find((s) => s.source.collection_name === 'advertisements');
  assert.ok(strip, 'advertisements should render');
  assert.strictEqual(strip.type, SECTION_TYPES.BANNER_STRIP);
});

test('a layout row can point a banner strip at a named placement', () => {
  const feed = assembleFromLayout({
    layout: [
      layoutEntry(SECTION_TYPES.BANNER_STRIP, {
        collection: 'banners',
        config: { section_name: 'home_middle' },
        id: 'row',
      }),
    ],
    hero: heroSection,
    mid: midSection,
  });

  assert.strictEqual(feed.length, 1);
  // The middle placement, not the hero's banners.
  assert.deepStrictEqual(feed[0].items, midSection.items);
});

test('a hero row still defaults to the top placement', () => {
  const feed = assembleFromLayout({
    layout: [layoutEntry(SECTION_TYPES.HERO_CAROUSEL, { id: 'row' })],
    hero: heroSection,
    mid: midSection,
  });

  assert.deepStrictEqual(feed[0].items, heroSection.items);
});

test('a layout row pointing at a placement with no banners is dropped', () => {
  const feed = assembleFromLayout({
    layout: [
      layoutEntry(SECTION_TYPES.BANNER_STRIP, {
        collection: 'banners',
        config: { section_name: 'home_middle' },
      }),
    ],
    hero: heroSection,
    mid: null,
  });

  assert.strictEqual(feed.length, 0);
});

test('a layout row pointing at advertisements resolves', () => {
  // This previously fell through to popular_categories and was dropped, so an
  // advertisements row in the builder rendered nothing with no explanation.
  const feed = assembleFromLayout({
    layout: [layoutEntry(SECTION_TYPES.BANNER_STRIP, { collection: 'advertisements', id: 'row' })],
    ads: adsSection,
  });

  assert.strictEqual(feed.length, 1);
  assert.deepStrictEqual(feed[0].items, adsSection.items);
});

test('a layout keeps the resolved collection, not the requested one', () => {
  // An untyped product rail falls back to best_sellers; the client is told
  // what it actually got.
  const feed = assembleFromLayout({
    layout: [layoutEntry(SECTION_TYPES.PRODUCT_RAIL, { sequence: 1, collection: 'none' })],
    bestSellers: [bestSellerSection(1)],
  });

  assert.strictEqual(feed[0].source.collection_name, 'best_sellers');
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
