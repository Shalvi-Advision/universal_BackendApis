const express = require('express');
const router = express.Router();
const OnboardingSlide = require('../../models/OnboardingSlide');
const { checkPermission } = require('../../middleware/checkPermission');

// Onboarding rides on the dynamicSection permission group like other
// merchandised content.
const view = checkPermission('dynamicSection', 'view');
const create = checkPermission('dynamicSection', 'create');
const edit = checkPermission('dynamicSection', 'edit');
const remove = checkPermission('dynamicSection', 'delete');

const MAX_SLIDES = 10;

// Builds the update/create payload from a request body, leaving out anything
// the caller did not send so a PUT can patch a single field.
function readSlide(body, { partial }) {
  const payload = {};

  if (!partial || 'title' in body) payload.title = String(body.title ?? '').trim();
  if (!partial || 'description' in body) {
    payload.description = String(body.description ?? '').trim();
  }
  if (!partial || 'image_url' in body) {
    payload.image_url = String(body.image_url ?? '').trim();
  }
  if ('sequence' in body) payload.sequence = Number(body.sequence) || 0;
  if ('is_active' in body) payload.is_active = body.is_active !== false && body.is_active !== 'false';

  return payload;
}

function validate(payload, { partial }) {
  if ((!partial || 'title' in payload) && !payload.title) return 'Title is required';
  if ((!partial || 'image_url' in payload) && !payload.image_url) return 'Image URL is required';
  if ('sequence' in payload && !Number.isFinite(payload.sequence)) {
    return 'Sequence must be a number';
  }
  return null;
}

// @route   GET /api/admin/onboarding
// @desc    Every slide, active or not, in display order
// @access  Admin (dynamicSection view)
router.get('/', view, async (req, res) => {
  try {
    const slides = await OnboardingSlide.findAllSorted();
    res.status(200).json({ success: true, count: slides.length, data: slides });
  } catch (error) {
    console.error('List onboarding slides error:', error);
    res.status(500).json({ success: false, message: 'Error fetching onboarding slides', error: error.message });
  }
});

// @route   POST /api/admin/onboarding
// @desc    Add a slide
// @access  Admin (dynamicSection create)
router.post('/', create, async (req, res) => {
  try {
    const payload = readSlide(req.body || {}, { partial: false });
    const error = validate(payload, { partial: false });
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const total = await OnboardingSlide.countDocuments({});
    if (total >= MAX_SLIDES) {
      return res.status(400).json({
        success: false,
        message: `An onboarding flow is limited to ${MAX_SLIDES} slides`,
      });
    }

    // Append to the end unless the caller placed it explicitly.
    if (!('sequence' in (req.body || {}))) {
      payload.sequence = total;
    }

    const slide = await OnboardingSlide.create(payload);
    res.status(201).json({ success: true, message: 'Slide added', data: slide });
  } catch (error) {
    console.error('Create onboarding slide error:', error);
    res.status(500).json({ success: false, message: 'Error creating onboarding slide', error: error.message });
  }
});

// @route   PUT /api/admin/onboarding/reorder
// @desc    Persist a new slide order in one write
// @access  Admin (dynamicSection edit)
//
// Declared before /:id so "reorder" is not read as an id.
router.put('/reorder', edit, async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : null;
    if (!ids || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'ids must be a non-empty array' });
    }

    await OnboardingSlide.bulkWrite(
      ids.map((id, index) => ({
        updateOne: { filter: { _id: id }, update: { $set: { sequence: index } } },
      }))
    );

    const slides = await OnboardingSlide.findAllSorted();
    res.status(200).json({ success: true, message: 'Order saved', data: slides });
  } catch (error) {
    console.error('Reorder onboarding slides error:', error);
    res.status(500).json({ success: false, message: 'Error reordering onboarding slides', error: error.message });
  }
});

// @route   PUT /api/admin/onboarding/:id
// @desc    Update a slide
// @access  Admin (dynamicSection edit)
router.put('/:id', edit, async (req, res) => {
  try {
    const payload = readSlide(req.body || {}, { partial: true });
    const error = validate(payload, { partial: true });
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const slide = await OnboardingSlide.findByIdAndUpdate(
      req.params.id,
      { $set: payload },
      { new: true, runValidators: true }
    );

    if (!slide) {
      return res.status(404).json({ success: false, message: 'Slide not found' });
    }

    res.status(200).json({ success: true, message: 'Slide saved', data: slide });
  } catch (error) {
    console.error('Update onboarding slide error:', error);
    res.status(500).json({ success: false, message: 'Error updating onboarding slide', error: error.message });
  }
});

// @route   DELETE /api/admin/onboarding/:id
// @desc    Remove a slide
// @access  Admin (dynamicSection delete)
router.delete('/:id', remove, async (req, res) => {
  try {
    const slide = await OnboardingSlide.findByIdAndDelete(req.params.id);
    if (!slide) {
      return res.status(404).json({ success: false, message: 'Slide not found' });
    }
    res.status(200).json({ success: true, message: 'Slide deleted' });
  } catch (error) {
    console.error('Delete onboarding slide error:', error);
    res.status(500).json({ success: false, message: 'Error deleting onboarding slide', error: error.message });
  }
});

module.exports = router;
