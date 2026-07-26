const mongoose = require('mongoose');

// Impressions and taps per home section.
//
// Without this there is no way to answer "which section actually sells", which
// is the reason for making the layout editable at all. Stored as pre-bucketed
// daily counters rather than raw events: the app batches, and a merchandiser
// wants a rate per day, not a stream.
const homeSectionEventSchema = new mongoose.Schema(
  {
    // The section id the feed sent. Kept as a plain string so events survive
    // the section being deleted — the numbers still mean something afterwards.
    section_id: { type: String, required: true, index: true },
    section_type: { type: String, default: '', index: true },
    store_code: { type: String, default: '', index: true },

    // Midnight of the day being counted, in server time.
    day: { type: Date, required: true, index: true },

    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'home_section_events' }
);

homeSectionEventSchema.index(
  { section_id: 1, day: 1, store_code: 1 },
  { unique: true }
);

module.exports = require('./tenantModel')('HomeSectionEvent', homeSectionEventSchema);
