// utils/homeSectionTypes.js
//
// Shared vocabulary for the home layout. Kept out of models/HomeSection.js
// because that module exports a tenant-model Proxy whose `get` trap resolves a
// database connection — constants hung off it would be unreadable.

// Section types the layout may contain. The app renders the ones it knows and
// skips the rest, so this list can run ahead of any released app version.
const SECTION_TYPES = [
  // Phase 1 — parity with the layout the app hardcoded.
  'hero_carousel',
  // A second banner placement, and how advertisements reach the home screen.
  'banner_strip',
  'category_strip',
  'category_grid',
  'product_rail',
  'offer_strip',
  'seasonal_picks',
  // Phase 3 — merchandising sections.
  'flash_sale',
  'deal_of_day',
  'buy_again',
  'recently_viewed',
  'free_delivery_progress',
  'coupon_strip',
  'brand_strip',
  'usp_strip',
];

// Which collection backs a section. `none` covers types whose content is
// computed (free-delivery progress) or client-side (recently viewed).
const SOURCE_COLLECTIONS = [
  'popular_categories',
  'seasonal_categories',
  'best_sellers',
  'top_sellers',
  'banners',
  'advertisements',
  'products',
  'none',
];

const AUDIENCES = ['all', 'new', 'returning', 'has_cart'];

// Types the server cannot fill without making the response user-specific.
// They are emitted as empty placeholders so the feed stays cacheable.
const PERSONALIZED_TYPES = [
  'offer_strip',
  'buy_again',
  'recently_viewed',
  'free_delivery_progress',
];

module.exports = { SECTION_TYPES, SOURCE_COLLECTIONS, AUDIENCES, PERSONALIZED_TYPES };
