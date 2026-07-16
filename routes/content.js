const express = require('express');
const router = express.Router();
const ContentPage = require('../models/ContentPage');

/**
 * @route   GET /api/content
 * @desc    List active content pages (slug + title only)
 * @access  Public
 */
router.get('/', async (req, res, next) => {
  try {
    const pages = await ContentPage.find({ is_active: true })
      .select('slug title updatedAt -_id')
      .sort({ slug: 1 });

    res.status(200).json({
      success: true,
      count: pages.length,
      data: pages
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/content/:slug
 * @desc    Get a content page (about-us, privacy-policy, terms, refund-policy, faq)
 * @access  Public
 */
router.get('/:slug', async (req, res, next) => {
  try {
    const slug = String(req.params.slug || '').toLowerCase().trim();

    const page = await ContentPage.findOne({ slug, is_active: true })
      .select('slug title html updatedAt -_id');

    if (!page) {
      return res.status(404).json({
        success: false,
        message: `Content page '${slug}' not found`
      });
    }

    res.status(200).json({
      success: true,
      data: page
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
