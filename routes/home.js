const express = require('express');
const router = express.Router();
const { buildHomeFeed, SCHEMA_VERSION } = require('../utils/homeFeedService');

// @route   POST /api/home/feed
// @desc    The home screen as an ordered list of typed sections
// @access  Public
//
// Public and cacheable: personalised slots are returned as empty placeholders
// for the client to fill, so nothing user-specific enters this response.
router.post('/feed', async (req, res, next) => {
  try {
    const { store_code } = req.body || {};

    const sections = await buildHomeFeed({ storeCode: store_code });

    res.status(200).json({
      success: true,
      schema_version: SCHEMA_VERSION,
      count: sections.length,
      message: `Found ${sections.length} home section(s)`,
      data: sections,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
