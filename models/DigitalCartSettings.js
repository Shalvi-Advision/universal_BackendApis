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
  // Big heading on the home (offer tiles) screen
  home_heading: {
    type: String,
    trim: true,
    default: 'Exclusive Offers'
  },
  // Second line inside the home screen's info card (footer_note is the first)
  info_sub_text: {
    type: String,
    trim: true,
    default: 'Hurry up and grab the best deals.'
  },
  // "Offer valid till 31st July" line on the offer page;
  // '' = fall back to the sheet's last-updated date
  valid_till_text: {
    type: String,
    trim: true,
    default: ''
  },
  // "About Us" link in the bottom navigation; '' = hide the About Us button
  about_url: {
    type: String,
    trim: true,
    default: ''
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
  },
  // Bottom navigation bar (Back / Offers / About Us) on the offer page
  show_bottom_nav: {
    type: Boolean,
    default: true
  },
  // Per-offer-group tile/hero overrides, keyed by group slug
  // (percent_off, buy_1_get_1, ...). Each entry may set color, label
  // (banner text), line1/line2 (big tile text) and ribbon. Empty/missing
  // values fall back to the website's built-in group styles.
  group_styles: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'digital_cart_settings'
});

module.exports = require('./tenantModel')('DigitalCartSettings', digitalCartSettingsSchema);
