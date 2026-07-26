const mongoose = require('mongoose');

// Onboarding carousel shown on first launch of the mobile app.
//
// A tenant-DB collection rather than keys on project.config: slides are an
// ordered list that admins add to, reorder and retire, which a flat scalar
// config document cannot express. Tenant-wide — there is no store scoping,
// because onboarding runs before a store has been selected.
const onboardingSlideSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    image_url: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true,
    },
    // Ascending display order. Ties fall back to creation order.
    sequence: {
      type: Number,
      default: 0,
      index: true,
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true, collection: 'onboarding_slides' }
);

// What the app renders, in the order it renders it.
onboardingSlideSchema.statics.findActiveSorted = function findActiveSorted() {
  return this.find({ is_active: true }).sort({ sequence: 1, createdAt: 1 }).lean();
};

onboardingSlideSchema.statics.findAllSorted = function findAllSorted() {
  return this.find({}).sort({ sequence: 1, createdAt: 1 }).lean();
};

module.exports = require('./tenantModel')('OnboardingSlide', onboardingSlideSchema);
