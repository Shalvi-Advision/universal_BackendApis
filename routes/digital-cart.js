const express = require('express');
const router = express.Router();
const DigitalCartItem = require('../models/DigitalCartItem');
const DigitalCartSettings = require('../models/DigitalCartSettings');
const { classifyOffer } = require('../utils/digitalCartCsv');
const { mergeGroupStyles } = require('../utils/digitalCartGroups');

// @route   GET /api/digital-cart
// @desc    Public list of active digital cart offers for the resolved project
//          (tenant comes from X-Project-Code header or ?project_code=)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const [items, settings] = await Promise.all([
      DigitalCartItem.find({ is_active: true })
        .sort({ position: 1 })
        .select('-__v -source_file'),
      DigitalCartSettings.findOne({}).select('-__v -_id -createdAt -updatedAt')
    ]);

    const lastUpdated = items.reduce(
      (acc, item) => (!acc || item.updatedAt > acc ? item.updatedAt : acc),
      null
    );

    // Items uploaded before offer grouping existed have no offer_group —
    // derive it here so the website tabs work without a re-upload
    const data = items.map((item) => {
      if (item.offer_group) return item;
      const obj = item.toObject();
      obj.offer_group = classifyOffer(obj.offer_text);
      return obj;
    });

    // ui.group_styles is always the full effective map (defaults merged
    // with admin overrides) — the website hardcodes no group visuals
    const ui = settings ? settings.toObject() : new DigitalCartSettings().toObject();
    ui.group_styles = mergeGroupStyles(ui.group_styles);

    res.status(200).json({
      success: true,
      data,
      ui,
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
