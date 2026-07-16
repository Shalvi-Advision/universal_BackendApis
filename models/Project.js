const mongoose = require('mongoose');
const { getControlDb } = require('../config/database');

// Tenant registry — lives in the control DB, NOT in any tenant DB.
// Onboarding a new client = one document here + a restored/seeded tenant DB.
const projectSchema = new mongoose.Schema(
  {
    project_code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    client_name: {
      type: String,
      required: true,
      trim: true,
    },
    db_name: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    // Public, frontend-safe config served by GET /api/project-config so a
    // single app/admin codebase can brand itself per client at runtime.
    config: {
      app_name: { type: String, default: '' },
      logo_url: { type: String, default: '' },
      primary_color: { type: String, default: '' },
      secondary_color: { type: String, default: '' },
      contact_email: { type: String, default: '' },
      contact_phone: { type: String, default: '' },
      currency: { type: String, default: 'INR' },
      razorpay_key_id: { type: String, default: '' },
      // Mobile app force-update policy (consumed by the Flutter app at launch).
      min_app_version: { type: String, default: '' },
      latest_app_version: { type: String, default: '' },
      android_store_url: { type: String, default: '' },
      ios_store_url: { type: String, default: '' },
      force_update_message: { type: String, default: '' },
    },
    // Server-side only credentials (never returned by public endpoints).
    secrets: {
      razorpay_key_secret: { type: String, default: '', select: false },
      sms_api_key: { type: String, default: '', select: false },
    },
  },
  { timestamps: true, collection: 'projects' }
);

// Compiled on the control connection (not a tenant proxy).
const getProjectModel = () => {
  const controlDb = getControlDb();
  return controlDb.models.Project || controlDb.model('Project', projectSchema);
};

module.exports = { getProjectModel, projectSchema };
