const mongoose = require('mongoose');

// Static content pages (about us, privacy policy, terms, refund policy, FAQ)
// served publicly to the mobile app / PWA per tenant.
const contentPageSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    // HTML body rendered by clients (flutter_html / dangerouslySetInnerHTML)
    html: {
      type: String,
      default: '',
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, collection: 'content_pages' }
);

module.exports = require('./tenantModel')('ContentPage', contentPageSchema);
