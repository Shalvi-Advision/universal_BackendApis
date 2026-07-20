const express = require('express');
const multer = require('multer');
const router = express.Router();
const DigitalCartItem = require('../../models/DigitalCartItem');
const { checkPermission } = require('../../middleware/checkPermission');
const { parseDigitalCartCsv } = require('../../utils/digitalCartCsv');

// CSV stays in memory — it is parsed and discarded, only rows are stored
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const isCsv = /\.csv$/i.test(file.originalname || '') ||
      ['text/csv', 'application/vnd.ms-excel', 'text/plain'].includes(file.mimetype);
    if (!isCsv) {
      return cb(new Error('Only .csv files are allowed'));
    }
    cb(null, true);
  }
});

// @route   GET /api/admin/digital-cart
// @desc    List all digital cart items (current published sheet)
// @access  Admin (digitalCart:view)
router.get('/', checkPermission('digitalCart', 'view'), async (req, res) => {
  try {
    const items = await DigitalCartItem.find({}).sort({ position: 1 });
    const latest = items.reduce(
      (acc, item) => (!acc || item.updatedAt > acc.updatedAt ? item : acc),
      null
    );

    res.status(200).json({
      success: true,
      data: items,
      meta: {
        total: items.length,
        active: items.filter((i) => i.is_active).length,
        source_file: latest ? latest.source_file : null,
        last_uploaded_at: latest ? latest.createdAt : null
      }
    });
  } catch (error) {
    console.error('Get digital cart error:', error);
    res.status(500).json({ success: false, message: 'Error fetching digital cart items', error: error.message });
  }
});

// @route   POST /api/admin/digital-cart/upload
// @desc    Upload offer sheet CSV — replaces ALL existing items for this project
// @access  Admin (digitalCart:create)
router.post(
  '/upload',
  checkPermission('digitalCart', 'create'),
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No CSV file uploaded (field name: "file")' });
      }

      const { items, error } = parseDigitalCartCsv(req.file.buffer.toString('utf8'));
      if (error) {
        return res.status(400).json({ success: false, message: error });
      }

      const sourceFile = req.file.originalname || 'upload.csv';
      const docs = items.map((item) => ({ ...item, source_file: sourceFile }));

      await DigitalCartItem.deleteMany({});
      await DigitalCartItem.insertMany(docs);

      res.status(201).json({
        success: true,
        message: `Digital cart updated: ${docs.length} products imported from ${sourceFile}`,
        data: { imported: docs.length, source_file: sourceFile }
      });
    } catch (error) {
      console.error('Upload digital cart CSV error:', error);
      res.status(500).json({ success: false, message: 'Error importing CSV', error: error.message });
    }
  }
);

// @route   PATCH /api/admin/digital-cart/:id/toggle
// @desc    Toggle a single item's visibility on the public site
// @access  Admin (digitalCart:edit)
router.patch('/:id/toggle', checkPermission('digitalCart', 'edit'), async (req, res) => {
  try {
    const item = await DigitalCartItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    item.is_active = !item.is_active;
    await item.save();

    res.status(200).json({
      success: true,
      message: `Item ${item.is_active ? 'shown' : 'hidden'}`,
      data: item
    });
  } catch (error) {
    console.error('Toggle digital cart item error:', error);
    res.status(500).json({ success: false, message: 'Error toggling item', error: error.message });
  }
});

// @route   DELETE /api/admin/digital-cart/:id
// @desc    Delete a single item
// @access  Admin (digitalCart:delete)
router.delete('/:id', checkPermission('digitalCart', 'delete'), async (req, res) => {
  try {
    const item = await DigitalCartItem.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    res.status(200).json({ success: true, message: 'Item deleted' });
  } catch (error) {
    console.error('Delete digital cart item error:', error);
    res.status(500).json({ success: false, message: 'Error deleting item', error: error.message });
  }
});

// @route   DELETE /api/admin/digital-cart
// @desc    Clear the whole digital cart for this project
// @access  Admin (digitalCart:delete)
router.delete('/', checkPermission('digitalCart', 'delete'), async (req, res) => {
  try {
    const result = await DigitalCartItem.deleteMany({});
    res.status(200).json({
      success: true,
      message: `Digital cart cleared (${result.deletedCount} items removed)`
    });
  } catch (error) {
    console.error('Clear digital cart error:', error);
    res.status(500).json({ success: false, message: 'Error clearing digital cart', error: error.message });
  }
});

module.exports = router;
