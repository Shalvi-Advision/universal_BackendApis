const express = require('express');
const router = express.Router();
const HomeSection = require('../../models/HomeSection');
const PopularCategory = require('../../models/PopularCategory');
const BestSeller = require('../../models/BestSeller');
const SeasonalCategory = require('../../models/SeasonalCategory');
const TopSeller = require('../../models/TopSeller');
const { checkPermission } = require('../../middleware/checkPermission');
const {
  SECTION_TYPES,
  SOURCE_COLLECTIONS,
  AUDIENCES,
  PERSONALIZED_TYPES,
} = require('../../utils/homeSectionTypes');

// The home layout rides on the dynamicSection permission group like the
// content it arranges.
const view = checkPermission('dynamicSection', 'view');
const create = checkPermission('dynamicSection', 'create');
const edit = checkPermission('dynamicSection', 'edit');
const remove = checkPermission('dynamicSection', 'delete');

const MAX_SECTIONS = 40;

function readSection(body, { partial }) {
  const payload = {};

  if (!partial || 'type' in body) payload.type = String(body.type ?? '').trim();
  if (!partial || 'title' in body) payload.title = String(body.title ?? '').trim();
  if ('sequence' in body) payload.sequence = Number(body.sequence) || 0;
  if ('is_active' in body) {
    payload.is_active = body.is_active !== false && body.is_active !== 'false';
  }
  if ('audience' in body) payload.audience = String(body.audience ?? 'all').trim();
  if ('store_codes' in body) {
    payload.store_codes = Array.isArray(body.store_codes)
      ? body.store_codes.map((c) => String(c).trim()).filter(Boolean)
      : [];
  }
  if ('starts_at' in body) payload.starts_at = body.starts_at ? new Date(body.starts_at) : null;
  if ('ends_at' in body) payload.ends_at = body.ends_at ? new Date(body.ends_at) : null;
  if ('style' in body) {
    payload.style = {
      background_color: String((body.style && body.style.background_color) || '').trim(),
    };
  }
  if ('config' in body) payload.config = body.config || {};
  if ('source' in body) {
    const source = body.source || {};
    payload.source = {
      collection_name: String(source.collection_name || 'none').trim(),
      sequence:
        source.sequence === '' || source.sequence == null ? null : Number(source.sequence),
      filter: source.filter || {},
    };
  }

  return payload;
}

function validate(payload, { partial }) {
  if ((!partial || 'type' in payload) && !SECTION_TYPES.includes(payload.type)) {
    return `type must be one of: ${SECTION_TYPES.join(', ')}`;
  }
  if ('audience' in payload && !AUDIENCES.includes(payload.audience)) {
    return `audience must be one of: ${AUDIENCES.join(', ')}`;
  }
  if (payload.source && !SOURCE_COLLECTIONS.includes(payload.source.collection_name)) {
    return `source.collection_name must be one of: ${SOURCE_COLLECTIONS.join(', ')}`;
  }
  if (payload.source && payload.source.sequence != null && !Number.isFinite(payload.source.sequence)) {
    return 'source.sequence must be a number';
  }
  if (payload.starts_at && Number.isNaN(payload.starts_at.getTime())) {
    return 'starts_at is not a valid date';
  }
  if (payload.ends_at && Number.isNaN(payload.ends_at.getTime())) {
    return 'ends_at is not a valid date';
  }
  if (payload.starts_at && payload.ends_at && payload.starts_at > payload.ends_at) {
    return 'starts_at must be before ends_at';
  }
  return null;
}

// @route   GET /api/admin/home-sections
// @desc    The layout, plus what can be selected as a source
// @access  Admin (dynamicSection view)
router.get('/', view, async (req, res) => {
  try {
    const [sections, popular, bestSellers, seasonal, topSellers] = await Promise.all([
      HomeSection.findAllSorted(),
      PopularCategory.find({}).select('title sequence is_active').sort({ sequence: 1 }).lean(),
      BestSeller.find({}).select('title sequence is_active').sort({ sequence: 1 }).lean(),
      SeasonalCategory.find({}).select('title sequence is_active').sort({ sequence: 1 }).lean(),
      TopSeller.find({}).select('title sequence is_active').sort({ sequence: 1 }).lean(),
    ]);

    const asOptions = (docs) =>
      docs.map((d) => ({
        sequence: d.sequence ?? null,
        title: d.title || `Section ${d.sequence ?? '?'}`,
        is_active: d.is_active !== false,
      }));

    res.status(200).json({
      success: true,
      count: sections.length,
      data: sections,
      meta: {
        section_types: SECTION_TYPES,
        personalized_types: PERSONALIZED_TYPES,
        audiences: AUDIENCES,
        sources: {
          popular_categories: asOptions(popular),
          best_sellers: asOptions(bestSellers),
          seasonal_categories: asOptions(seasonal),
          top_sellers: asOptions(topSellers),
        },
      },
    });
  } catch (error) {
    console.error('List home sections error:', error);
    res.status(500).json({ success: false, message: 'Error fetching home sections', error: error.message });
  }
});

// @route   POST /api/admin/home-sections/adopt
// @desc    Materialise the app's default layout as editable documents
// @access  Admin (dynamicSection create)
//
// Until a project has layout documents the feed serves the built-in
// arrangement. This turns that arrangement into rows the merchandiser can
// reorder — the on-ramp to the Home Builder, and a no-op visually.
router.post('/adopt', create, async (req, res) => {
  try {
    const existing = await HomeSection.countDocuments({});
    if (existing > 0) {
      return res.status(400).json({
        success: false,
        message: 'This project already has a home layout',
      });
    }

    const [popular, bestSellers, seasonal] = await Promise.all([
      PopularCategory.find({ is_active: true }).select('sequence').sort({ sequence: 1 }).lean(),
      BestSeller.find({ is_active: true }).select('sequence').sort({ sequence: 1 }).lean(),
      SeasonalCategory.find({ is_active: true }).select('sequence').sort({ sequence: 1 }).lean(),
    ]);

    const has = (docs, sequence) => docs.some((d) => Number(d.sequence) === sequence);

    const layout = [];
    const push = (type, { collection_name = 'none', sequence = null } = {}) =>
      layout.push({
        type,
        sequence: layout.length,
        is_active: true,
        source: { collection_name, sequence, filter: {} },
      });

    if (has(popular, 1)) {
      push('category_strip', { collection_name: 'popular_categories', sequence: 1 });
    }
    push('hero_carousel', { collection_name: 'banners' });

    for (let i = 0; i < 4; i += 1) {
      if (has(popular, i + 2)) {
        push('category_grid', { collection_name: 'popular_categories', sequence: i + 2 });
      }
      if (has(bestSellers, i + 1)) {
        push('product_rail', { collection_name: 'best_sellers', sequence: i + 1 });
      }
      push('offer_strip');
    }

    if (seasonal.length > 0) {
      push('seasonal_picks', {
        collection_name: 'seasonal_categories',
        sequence: Number(seasonal[0].sequence) || 1,
      });
    }

    const created = await HomeSection.insertMany(layout);

    res.status(201).json({
      success: true,
      message: `Adopted the current layout as ${created.length} editable section(s)`,
      count: created.length,
      data: await HomeSection.findAllSorted(),
    });
  } catch (error) {
    console.error('Adopt home layout error:', error);
    res.status(500).json({ success: false, message: 'Error adopting layout', error: error.message });
  }
});

// @route   PUT /api/admin/home-sections/reorder
// @desc    Persist a new order in one write
// @access  Admin (dynamicSection edit)
router.put('/reorder', edit, async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : null;
    if (!ids || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'ids must be a non-empty array' });
    }

    await HomeSection.bulkWrite(
      ids.map((id, index) => ({
        updateOne: { filter: { _id: id }, update: { $set: { sequence: index } } },
      }))
    );

    res.status(200).json({ success: true, message: 'Order saved', data: await HomeSection.findAllSorted() });
  } catch (error) {
    console.error('Reorder home sections error:', error);
    res.status(500).json({ success: false, message: 'Error reordering sections', error: error.message });
  }
});

// @route   POST /api/admin/home-sections
// @desc    Add a section
// @access  Admin (dynamicSection create)
router.post('/', create, async (req, res) => {
  try {
    const payload = readSection(req.body || {}, { partial: false });
    const error = validate(payload, { partial: false });
    if (error) return res.status(400).json({ success: false, message: error });

    const total = await HomeSection.countDocuments({});
    if (total >= MAX_SECTIONS) {
      return res.status(400).json({
        success: false,
        message: `A home layout is limited to ${MAX_SECTIONS} sections`,
      });
    }
    if (!('sequence' in (req.body || {}))) payload.sequence = total;

    const created = await HomeSection.create(payload);
    res.status(201).json({ success: true, message: 'Section added', data: created });
  } catch (error) {
    console.error('Create home section error:', error);
    res.status(500).json({ success: false, message: 'Error creating section', error: error.message });
  }
});

// @route   PUT /api/admin/home-sections/:id
// @desc    Update a section
// @access  Admin (dynamicSection edit)
router.put('/:id', edit, async (req, res) => {
  try {
    const payload = readSection(req.body || {}, { partial: true });
    const error = validate(payload, { partial: true });
    if (error) return res.status(400).json({ success: false, message: error });

    const updated = await HomeSection.findByIdAndUpdate(
      req.params.id,
      { $set: payload },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: 'Section not found' });
    res.status(200).json({ success: true, message: 'Section saved', data: updated });
  } catch (error) {
    console.error('Update home section error:', error);
    res.status(500).json({ success: false, message: 'Error updating section', error: error.message });
  }
});

// @route   DELETE /api/admin/home-sections/:id
// @desc    Remove a section from the layout (the content it pointed at is kept)
// @access  Admin (dynamicSection delete)
router.delete('/:id', remove, async (req, res) => {
  try {
    const deleted = await HomeSection.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Section not found' });
    res.status(200).json({ success: true, message: 'Section removed' });
  } catch (error) {
    console.error('Delete home section error:', error);
    res.status(500).json({ success: false, message: 'Error deleting section', error: error.message });
  }
});

module.exports = router;
