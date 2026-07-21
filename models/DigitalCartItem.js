const mongoose = require('mongoose');

// One row of the Digital Cart offer sheet. The whole collection is replaced
// on every CSV upload, so rows carry their sheet position + source file.
const digitalCartItemSchema = new mongoose.Schema({
  p_code: {
    type: String,
    trim: true,
    default: ''
  },
  product_name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  // Raw strings straight from the sheet — values like "ALL MRP" are valid
  mrp: {
    type: String,
    trim: true,
    default: ''
  },
  offer_price: {
    type: String,
    trim: true,
    default: ''
  },
  // Numeric values when the raw strings parse, for sorting/formatting
  mrp_value: {
    type: Number,
    default: null
  },
  offer_price_value: {
    type: Number,
    default: null
  },
  offer_text: {
    type: String,
    trim: true,
    default: ''
  },
  // Product photo: from the CSV's optional Image column, an admin upload,
  // or auto-matched from the tenant's product master (pcode_img) at read time
  image_url: {
    type: String,
    trim: true,
    default: ''
  },
  // Normalized offer category derived from offer_text at CSV import
  // ("Buy 1 Get 1", "Special Price", ...) — drives the tabs on the website
  offer_group: {
    type: String,
    trim: true,
    default: ''
  },
  position: {
    type: Number,
    default: 0
  },
  is_active: {
    type: Boolean,
    default: true
  },
  source_file: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true,
  collection: 'digital_cart_items'
});

digitalCartItemSchema.index({ is_active: 1, position: 1 });

module.exports = require('./tenantModel')('DigitalCartItem', digitalCartItemSchema);
