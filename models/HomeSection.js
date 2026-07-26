const mongoose = require('mongoose');

// A slot on the mobile app's home screen.
//
// This collection is the layout: which sections exist, in what order, and what
// backs each one. Content still lives in the collections it always did
// (PopularCategory, BestSeller, Banner…) — a HomeSection points at one via
// `source`. Separating the two is what lets a merchandiser rearrange home
// without touching the content, and add a section type the app has never
// rendered before without a release.
//
// A tenant with no documents here gets the default layout the app shipped
// with, so this collection is opt-in per project.

const {
  SECTION_TYPES,
  SOURCE_COLLECTIONS,
  AUDIENCES,
} = require('../utils/homeSectionTypes');

const homeSectionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, 'Section type is required'],
      enum: {
        values: SECTION_TYPES,
        message: 'Unsupported section type: {VALUE}',
      },
      index: true,
    },

    /// Overrides the source document's title when set.
    title: { type: String, default: '', trim: true },

    source: {
      collection_name: {
        type: String,
        enum: SOURCE_COLLECTIONS,
        default: 'none',
      },
      // Which document in that collection, by its own `sequence`. Sequence
      // rather than _id because that is how the app has always addressed these
      // sections, and how the seeded default layout refers to them.
      sequence: { type: Number, default: null },
      // Free-form selector for query-driven sections (min discount, brand…).
      filter: { type: mongoose.Schema.Types.Mixed, default: {} },
    },

    // Display order, ascending.
    sequence: { type: Number, default: 0, index: true },

    is_active: { type: Boolean, default: true, index: true },

    // Campaign window. Null means "no limit at this end".
    starts_at: { type: Date, default: null },
    ends_at: { type: Date, default: null },

    // Who sees it. Enforced client-side for the personalised values, because
    // the feed itself must stay cacheable.
    audience: { type: String, enum: AUDIENCES, default: 'all' },

    // Stores this section applies to. Empty means every store.
    store_codes: { type: [String], default: [] },

    style: {
      background_color: { type: String, default: '' },
    },

    // Per-type settings — countdown label, item cap, CTA. Kept loose so a new
    // section type does not need a schema change.
    config: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: 'home_sections' }
);

/// Sections to render now: active, in window, and matching the store.
homeSectionSchema.statics.findRenderable = function findRenderable({
  storeCode = '',
  now = new Date(),
} = {}) {
  const query = {
    is_active: true,
    $and: [
      { $or: [{ starts_at: null }, { starts_at: { $lte: now } }] },
      { $or: [{ ends_at: null }, { ends_at: { $gte: now } }] },
    ],
  };

  const trimmed = (storeCode || '').toString().trim();
  if (trimmed) {
    query.$and.push({
      $or: [{ store_codes: { $size: 0 } }, { store_codes: trimmed }],
    });
  }

  return this.find(query).sort({ sequence: 1, createdAt: 1 }).lean();
};

homeSectionSchema.statics.findAllSorted = function findAllSorted() {
  return this.find({}).sort({ sequence: 1, createdAt: 1 }).lean();
};

module.exports = require('./tenantModel')('HomeSection', homeSectionSchema);
