// utils/homeFeedService.js
//
// Builds the mobile app's home screen as an ordered list of typed sections.
//
// Phase 1 composes the feed from the collections that already back the home
// screen — no data migration, and the existing admin pages keep editing the
// same documents. The layout (which sections, in what order) is seeded from
// the order the Flutter app currently hardcodes, so switching the app onto the
// feed is a no-op visually. Phase 2 replaces the seeded layout with a
// HomeSection collection the panel writes to.
//
// Contract notes:
//   - Sections the app does not recognise must be skipped, not fatal, so new
//     section types can ship before an app release.
//   - `personalized: true` sections carry no items. They are placeholders the
//     client fills (cart-dependent offers today, per-user rails later). This
//     keeps the feed itself public and cacheable — retrofitting that split
//     after per-user data leaks into the payload would be a breaking change.

const PopularCategory = require('../models/PopularCategory');
const SeasonalCategory = require('../models/SeasonalCategory');
const BestSeller = require('../models/BestSeller');
const TopSeller = require('../models/TopSeller');
const Banner = require('../models/Banner');
const HomeSection = require('../models/HomeSection');
const ProductMaster = require('../models/ProductMaster');

const { enrichPopularCategorySections } = require('../routes/popular-categories');
const { enrichSeasonalCategorySections } = require('../routes/seasonal-categories');
const { mapProductMaster } = require('../routes/best-sellers');
const { PERSONALIZED_TYPES } = require('./homeSectionTypes');

const SCHEMA_VERSION = 1;

// Section types the app knows in Phase 1. Adding one here plus a renderer in
// the app is the whole cost of a new section type.
const SECTION_TYPES = {
  HERO_CAROUSEL: 'hero_carousel',
  CATEGORY_STRIP: 'category_strip',
  CATEGORY_GRID: 'category_grid',
  PRODUCT_RAIL: 'product_rail',
  OFFER_STRIP: 'offer_strip',
  SEASONAL_PICKS: 'seasonal_picks',
};

// How many best-seller rails and offer slots the current app interleaves.
// Mirrors `bestSellerCount` in the Flutter home screen.
const BEST_SELLER_SLOTS = 4;
const OFFER_SLOTS = 4;

const storeQuery = (storeCode) => {
  const query = { is_active: true };
  const trimmed = (storeCode || '').toString().trim();
  if (trimmed) {
    query.$or = [{ store_codes: trimmed }, { store_code: trimmed }];
  }
  return query;
};

const bySequence = { sequence: 1, createdAt: -1 };

/** Sections keyed by their `sequence`, which is how the app addresses them. */
const bySequenceMap = (docs) => {
  const map = new Map();
  docs.forEach((doc) => {
    const key = Number(doc.sequence);
    if (Number.isFinite(key) && !map.has(key)) map.set(key, doc);
  });
  return map;
};

/** Attaches product_details to a best-seller/top-seller section's products. */
async function enrichProducts(sections) {
  const codes = Array.from(
    new Set(sections.flatMap((s) => (s.products || []).map((p) => p.p_code)))
  ).filter(Boolean);

  if (codes.length === 0) return sections;

  const products = await ProductMaster.find({
    p_code: { $in: codes },
    pcode_status: 'Y',
  });

  const productMap = new Map();
  products.forEach((product) => {
    productMap.set(product.p_code, mapProductMaster(product));
  });

  return sections.map((section) => ({
    ...section,
    products: (section.products || []).map((product) => ({
      ...product,
      product_details: productMap.get(product.p_code) || null,
    })),
  }));
}

const styleOf = (doc) => ({
  background_color: doc?.background_color || '',
  banner_urls: doc?.banner_urls || null,
});

/** A section carrying content. */
const section = ({ id, type, sourceSequence, title, description, style, items }) => ({
  id: id ? String(id) : `${type}-${sourceSequence ?? 0}`,
  type,
  // Which document this came from. The app's Phase 1 renderers still address
  // sections by sequence, so this is what lets them line up.
  source: { sequence: sourceSequence ?? null },
  title: title || '',
  description: description || '',
  style: style || {},
  personalized: false,
  ends_at: null,
  audience: 'all',
  config: {},
  items: items || [],
});

/**
 * Campaign metadata the client needs to render a section correctly:
 * `ends_at` drives countdowns, `audience` is matched on the device (the feed
 * stays cacheable, so it cannot be filtered server-side), and `config` carries
 * per-type settings.
 */
const campaignMeta = (entry) => ({
  ends_at: entry.ends_at ? new Date(entry.ends_at).toISOString() : null,
  audience: entry.audience || 'all',
  config: entry.config || {},
});

/** A slot the client fills from data the server deliberately does not hold. */
const personalizedSection = ({ type, index }) => ({
  id: `${type}-${index}`,
  type,
  source: { index },
  title: '',
  description: '',
  style: {},
  personalized: true,
  ends_at: null,
  audience: 'all',
  config: {},
  items: [],
});

async function heroCarousel(storeCode) {
  const trimmed = (storeCode || '').toString().trim();
  const banners = trimmed
    ? await Banner.findByStoreCodes({
        storeCodes: [trimmed],
        sectionName: 'home_top',
        activeOnly: true,
      })
    : await Banner.findActive({ sectionName: 'home_top' });

  if (!banners || banners.length === 0) return null;

  const grouped = await Banner.groupBySections(banners);
  const items = grouped.flatMap((group) => group.banners || []);
  if (items.length === 0) return null;

  return section({
    id: 'home_top',
    type: SECTION_TYPES.HERO_CAROUSEL,
    sourceSequence: 0,
    title: '',
    items,
  });
}

/**
 * Arranges already-fetched, already-enriched documents into the ordered feed.
 *
 * Split from the fetching so the layout — the part with all the sequencing
 * rules — can be tested without a database.
 */
function assembleFeed({ popular = [], seasonal = [], bestSellers = [], hero = null } = {}) {
  const popularBySeq = bySequenceMap(popular);
  const bestSellerBySeq = bySequenceMap(bestSellers);

  const sections = [];

  // 1. Category strip — popular-category section 1.
  const strip = popularBySeq.get(1);
  if (strip) {
    sections.push(
      section({
        id: strip._id,
        type: SECTION_TYPES.CATEGORY_STRIP,
        sourceSequence: 1,
        title: strip.title,
        description: strip.description,
        style: styleOf(strip),
        items: strip.subcategories || [],
      })
    );
  }

  // 2. Hero banners.
  if (hero) sections.push(hero);

  // 3. Popular category grids, best-seller rails and offer slots interleaved,
  //    exactly as the app lays them out today.
  const pairs = Math.max(BEST_SELLER_SLOTS, OFFER_SLOTS);
  for (let i = 0; i < pairs; i += 1) {
    const popularSeq = i + 2; // sections 2..5
    const popularDoc = popularBySeq.get(popularSeq);
    if (popularDoc) {
      sections.push(
        section({
          id: popularDoc._id,
          type: SECTION_TYPES.CATEGORY_GRID,
          sourceSequence: popularSeq,
          title: popularDoc.title,
          description: popularDoc.description,
          style: styleOf(popularDoc),
          items: popularDoc.subcategories || [],
        })
      );
    }

    const bestSellerSeq = i + 1;
    const bestSellerDoc = bestSellerBySeq.get(bestSellerSeq);
    if (bestSellerDoc && i < BEST_SELLER_SLOTS) {
      sections.push(
        section({
          id: bestSellerDoc._id,
          type: SECTION_TYPES.PRODUCT_RAIL,
          sourceSequence: bestSellerSeq,
          title: bestSellerDoc.title,
          description: bestSellerDoc.description,
          style: styleOf(bestSellerDoc),
          items: bestSellerDoc.products || [],
        })
      );
    }

    // Cart-dependent, so the server cannot fill it without making the feed
    // per-user. The client renders it from its own offers call.
    if (i < OFFER_SLOTS) {
      sections.push(personalizedSection({ type: SECTION_TYPES.OFFER_STRIP, index: i }));
    }
  }

  // 4. Seasonal picks.
  const seasonalFirst = seasonal[0];
  if (seasonalFirst) {
    sections.push(
      section({
        id: seasonalFirst._id,
        type: SECTION_TYPES.SEASONAL_PICKS,
        sourceSequence: Number(seasonalFirst.sequence) || 1,
        title: seasonalFirst.title,
        description: seasonalFirst.description,
        style: styleOf(seasonalFirst),
        items: seasonalFirst.subcategories || [],
      })
    );
  }

  // Assign render order last so slots stay contiguous however the layout was
  // assembled.
  return sections.map((s, index) => ({ ...s, slot: index }));
}

/**
 * The whole home feed for a store, in render order.
 *
 * Returns public, cacheable content only.
 */
async function buildHomeFeed({ storeCode, now = new Date() } = {}) {
  const query = storeQuery(storeCode);

  const [popularDocs, seasonalDocs, bestSellerDocs, topSellerDocs, hero, layout] =
    await Promise.all([
      PopularCategory.find(query).sort(bySequence).lean(),
      SeasonalCategory.find(query).sort(bySequence).lean(),
      BestSeller.find(query).sort(bySequence).lean(),
      TopSeller.find(query).sort(bySequence).lean(),
      heroCarousel(storeCode),
      HomeSection.findRenderable({ storeCode, now }),
    ]);

  const [popular, seasonal, bestSellers, topSellers] = await Promise.all([
    enrichPopularCategorySections(popularDocs),
    enrichSeasonalCategorySections(seasonalDocs),
    enrichProducts(bestSellerDocs),
    enrichProducts(topSellerDocs),
  ]);

  // A tenant that has never opened the Home Builder has no layout documents,
  // and gets the default arrangement — so adopting the builder is opt-in and
  // reversible by deleting the documents.
  if (Array.isArray(layout) && layout.length > 0) {
    return assembleFromLayout({ layout, popular, seasonal, bestSellers, topSellers, hero });
  }

  return assembleFeed({ popular, seasonal, bestSellers, hero });
}

/**
 * Builds the feed from an admin-defined layout (the HomeSection collection).
 *
 * Content still comes from the collections it always did; a HomeSection only
 * says which one, in what position. A section pointing at a document that has
 * since been deleted is dropped rather than rendered empty.
 */
function assembleFromLayout({ layout = [], popular = [], seasonal = [], bestSellers = [], topSellers = [], hero = null } = {}) {
  const popularBySeq = bySequenceMap(popular);
  const seasonalBySeq = bySequenceMap(seasonal);
  const bestSellerBySeq = bySequenceMap(bestSellers);
  const topSellerBySeq = bySequenceMap(topSellers);

  const sections = [];

  layout.forEach((entry, index) => {
    const type = entry.type;
    const sequence = entry.source && entry.source.sequence != null
      ? Number(entry.source.sequence)
      : null;

    // Placeholders the client fills; nothing to resolve server-side.
    if (PERSONALIZED_TYPES.includes(type)) {
      sections.push({
        ...personalizedSection({ type, index }),
        ...campaignMeta(entry),
        id: String(entry._id || `${type}-${index}`),
        title: entry.title || '',
        style: { background_color: (entry.style && entry.style.background_color) || '' },
      });
      return;
    }

    if (type === SECTION_TYPES.HERO_CAROUSEL) {
      if (hero) {
        sections.push({
          ...hero,
          ...campaignMeta(entry),
          id: String(entry._id || hero.id),
          title: entry.title || hero.title,
        });
      }
      return;
    }

    const collection = (entry.source && entry.source.collection_name) || 'none';

    let doc = null;
    let items = [];

    if (collection === 'best_sellers' || (type === SECTION_TYPES.PRODUCT_RAIL && collection === 'none')) {
      doc = bestSellerBySeq.get(sequence);
      items = doc ? doc.products || [] : [];
    } else if (collection === 'top_sellers') {
      doc = topSellerBySeq.get(sequence);
      items = doc ? doc.products || [] : [];
    } else if (collection === 'seasonal_categories') {
      doc = seasonalBySeq.get(sequence);
      items = doc ? doc.subcategories || [] : [];
    } else {
      doc = popularBySeq.get(sequence);
      items = doc ? doc.subcategories || [] : [];
    }

    // The source document was deleted or deactivated; a heading with nothing
    // under it is worse than no section.
    if (!doc) return;

    sections.push({
      ...section({
        id: entry._id,
        type,
        sourceSequence: sequence,
        title: entry.title || doc.title,
        description: doc.description,
        style: {
          background_color:
            (entry.style && entry.style.background_color) || doc.background_color || '',
        },
        items,
      }),
      ...campaignMeta(entry),
    });
  });

  return sections.map((s, i) => ({ ...s, slot: i }));
}

module.exports = {
  buildHomeFeed,
  assembleFeed,
  assembleFromLayout,
  enrichProducts,
  SCHEMA_VERSION,
  SECTION_TYPES,
  BEST_SELLER_SLOTS,
  OFFER_SLOTS,
  // Exported for a Phase 2 layout builder that will offer top-sellers as a
  // product_rail source; unused by the seeded layout so Phase 1 stays at
  // visual parity.
  TopSeller,
};
