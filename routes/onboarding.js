const express = require('express');
const router = express.Router();
const OnboardingSlide = require('../models/OnboardingSlide');

// Shape the mobile app consumes. Kept explicit so adding an internal field to
// the model does not silently start shipping to clients.
const toPublic = (slide) => ({
  id: String(slide._id),
  title: slide.title,
  description: slide.description || '',
  image_url: slide.image_url,
  sequence: slide.sequence ?? 0,
});

// @route   POST /api/onboarding/list
// @desc    Active onboarding slides in display order
// @access  Public
//
// POST rather than GET to match the other app-facing list endpoints
// (best-sellers, popular-categories, banners), which the app calls with a
// JSON body carrying project_code.
router.post('/list', async (req, res, next) => {
  try {
    const slides = await OnboardingSlide.findActiveSorted();

    res.status(200).json({
      success: true,
      count: slides.length,
      message: `Found ${slides.length} onboarding slide(s)`,
      data: slides.map(toPublic),
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/onboarding
// @desc    Same list, for clients that prefer a plain GET
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    const slides = await OnboardingSlide.findActiveSorted();

    res.status(200).json({
      success: true,
      count: slides.length,
      data: slides.map(toPublic),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
