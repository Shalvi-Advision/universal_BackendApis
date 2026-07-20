const express = require('express');
const router = express.Router();
const DigitalCartItem = require('../models/DigitalCartItem');

// @route   GET /api/digital-cart
// @desc    Public list of active digital cart offers for the resolved project
//          (tenant comes from X-Project-Code header or ?project_code=)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const items = await DigitalCartItem.find({ is_active: true })
      .sort({ position: 1 })
      .select('-__v -source_file');

    const lastUpdated = items.reduce(
      (acc, item) => (!acc || item.updatedAt > acc ? item.updatedAt : acc),
      null
    );

    res.status(200).json({
      success: true,
      data: items,
      meta: {
        total: items.length,
        last_updated: lastUpdated
      }
    });
  } catch (error) {
    console.error('Get public digital cart error:', error);
    res.status(500).json({ success: false, message: 'Error fetching digital cart', error: error.message });
  }
});

module.exports = router;
