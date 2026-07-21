const mongoose = require('mongoose');

// Per-tenant appearance settings for the public Digital Cart website.
// Singleton document (one per tenant DB); schema defaults double as the
// "not configured yet" response, so `new Model().toObject()` = defaults.
// Empty color strings mean: fall back to project branding, then app defaults.
const digitalCartSettingsSchema = new mongoose.Schema({
  header_title: {
    type: String,
    trim: true,
    default: '' // '' = use the project's client name
  },
  logo_url: {
    type: String,
    trim: true,
    default: '' // '' = use the project branding logo
  },
  tagline: {
    type: String,
    trim: true,
    default: "Digital Cart · This Month's Offers"
  },
  footer_note: {
    type: String,
    trim: true,
    default: 'Offers valid till stocks last.'
  },
  primary_color: {
    type: String,
    trim: true,
    default: '' // header background, offer price
  },
  accent_color: {
    type: String,
    trim: true,
    default: '' // offer badge
  },
  background_color: {
    type: String,
    trim: true,
    default: ''
  },
  card_color: {
    type: String,
    trim: true,
    default: ''
  },
  text_color: {
    type: String,
    trim: true,
    default: ''
  },
  // Product card corner rounding in px (0 = square corners)
  card_radius: {
    type: Number,
    min: 0,
    max: 40,
    default: 14
  },
  show_discount_percent: {
    type: Boolean,
    default: true
  },
  show_product_code: {
    type: Boolean,
    default: true
  },
  show_search: {
    type: Boolean,
    default: true
  },
  show_last_updated: {
    type: Boolean,
    default: true
  },
  show_logo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'digital_cart_settings'
});

module.exports = require('./tenantModel')('DigitalCartSettings', digitalCartSettingsSchema);
