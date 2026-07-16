const express = require('express');
const router = express.Router();
const ContentPage = require('../../models/ContentPage');
const { checkPermission } = require('../../middleware/checkPermission');

// Content pages ride on the dynamicSection permission group like other
// merchandised content.
const view = checkPermission('dynamicSection', 'view');
const edit = checkPermission('dynamicSection', 'edit');
const remove = checkPermission('dynamicSection', 'delete');

// @route   GET /api/admin/content-pages
// @desc    List all content pages (including inactive)
// @access  Admin
router.get('/', view, async (req, res) => {
  try {
    const pages = await ContentPage.find({}).sort({ slug: 1 });
    res.status(200).json({ success: true, data: pages });
  } catch (error) {
    console.error('List content pages error:', error);
    res.status(500).json({ success: false, message: 'Error fetching content pages', error: error.message });
  }
});

// @route   PUT /api/admin/content-pages/:slug
// @desc    Create or update a content page by slug (upsert)
// @access  Admin
router.put('/:slug', edit, async (req, res) => {
  try {
    const slug = String(req.params.slug || '').toLowerCase().trim();
    const { title, html, is_active } = req.body;

    if (!slug) {
      return res.status(400).json({ success: false, message: 'Slug is required' });
    }
    if (!title || !String(title).trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const update = {
      title: String(title).trim(),
      html: typeof html === 'string' ? html : '',
    };
    if (typeof is_active === 'boolean') {
      update.is_active = is_active;
    }

    const page = await ContentPage.findOneAndUpdate(
      { slug },
      { $set: update, $setOnInsert: { slug } },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Content page saved successfully',
      data: page
    });
  } catch (error) {
    console.error('Save content page error:', error);
    res.status(500).json({ success: false, message: 'Error saving content page', error: error.message });
  }
});

// @route   DELETE /api/admin/content-pages/:slug
// @desc    Delete a content page
// @access  Admin
router.delete('/:slug', remove, async (req, res) => {
  try {
    const slug = String(req.params.slug || '').toLowerCase().trim();
    const page = await ContentPage.findOneAndDelete({ slug });

    if (!page) {
      return res.status(404).json({ success: false, message: 'Content page not found' });
    }

    res.status(200).json({ success: true, message: 'Content page deleted successfully' });
  } catch (error) {
    console.error('Delete content page error:', error);
    res.status(500).json({ success: false, message: 'Error deleting content page', error: error.message });
  }
});

module.exports = router;
