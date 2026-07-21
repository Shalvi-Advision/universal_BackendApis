const express = require('express');
const router = express.Router();
const DigitalCartItem = require('../models/DigitalCartItem');
const DigitalCartSettings = require('../models/DigitalCartSettings');
const { offerGroupName } = require('../utils/digitalCartCsv');
const { buildGroups } = require('../utils/digitalCartGroups');
const ProductMaster = require('../models/ProductMaster');

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

    // Groups are dynamic — derived from the sheet's Offer column at read
    // time, so stored offer_group values (including legacy category names)
    // never go stale
    const data = items.map((item) => {
      const obj = item.toObject();
      obj.offer_group = offerGroupName(obj.offer_text);
      return obj;
    });

    // Items without an image (no CSV Image column / admin upload) borrow
    // the photo from the tenant's product master when the P-Code matches
    const missingCodes = [...new Set(
      data.filter((obj) => !obj.image_url && obj.p_code).map((obj) => obj.p_code)
    )];
    if (missingCodes.length > 0) {
      const masters = await ProductMaster.find({
        p_code: { $in: missingCodes },
        pcode_img: { $nin: [null, ''] }
      }).select('p_code pcode_img');
      const imageByCode = {};
      for (const master of masters) imageByCode[master.p_code] = master.pcode_img;
      for (const obj of data) {
        if (!obj.image_url && imageByCode[obj.p_code]) obj.image_url = imageByCode[obj.p_code];
      }
    }

    const ui = settings ? settings.toObject() : new DigitalCartSettings().toObject();

    res.status(200).json({
      success: true,
      data,
      ui,
      // One entry per distinct offer in the sheet (order preserved), with
      // the effective tile/banner style: derived default + admin override
      groups: buildGroups(data, ui.group_styles),
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
