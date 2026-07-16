const express = require('express');
const router = express.Router();
const { upload, saveUploadedImage } = require('../config/mediaStorage');
const { protect, authorize } = require('../middleware/auth');

/**
 * @route   POST /api/upload/image
 * @desc    Upload a single image to VPS media storage
 * @access  Private (Admin only)
 */
router.post('/image', protect, authorize('admin'), upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided',
      });
    }

    const folder = req.body.folder || 'ecommerce';
    const result = await saveUploadedImage(req.file, folder);

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: result,
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/upload/images
 * @desc    Upload multiple images to VPS media storage
 * @access  Private (Admin only)
 */
router.post('/images', protect, authorize('admin'), upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No image files provided',
      });
    }

    const folder = req.body.folder || 'ecommerce';
    const uploadedImages = await Promise.all(
      req.files.map((file) => saveUploadedImage(file, folder))
    );

    res.status(200).json({
      success: true,
      message: `${uploadedImages.length} image(s) uploaded successfully`,
      data: uploadedImages,
    });
  } catch (error) {
    console.error('Images upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload images',
      error: error.message,
    });
  }
});

module.exports = router;
