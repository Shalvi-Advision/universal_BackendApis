const express = require('express');
const router = express.Router();
const { getProjectModel } = require('../../models/Project');
const { checkPermission } = require('../../middleware/checkPermission');

// Branding/app settings ride on the dynamicSection permission group like
// other merchandised content. requireProjectAccess (mounted on /api/admin)
// already guarantees the admin may act on the resolved project.
const view = checkPermission('dynamicSection', 'view');
const edit = checkPermission('dynamicSection', 'edit');

// Only these config keys are editable from the panel. Notably absent:
// razorpay_key_id / currency (payment-critical, managed server-side) and
// anything outside config (db_name, status, project_code).
const EDITABLE_FIELDS = [
  'app_name',
  'logo_url',
  'splash_logo_url',
  'primary_color',
  'secondary_color',
  'accent_color',
  'background_color',
  'text_primary_color',
  'text_secondary_color',
  'success_color',
  'warning_color',
  'error_color',
  'info_color',
  'font_family',
  'contact_email',
  'contact_phone',
  'min_app_version',
  'latest_app_version',
  'android_store_url',
  'ios_store_url',
  'force_update_message',
];

const COLOR_FIELDS = EDITABLE_FIELDS.filter((f) => f.endsWith('_color'));
const HEX_COLOR = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

// @route   GET /api/admin/project-settings
// @desc    Full config of the currently selected project
// @access  Admin (dynamicSection view)
router.get('/', view, async (req, res) => {
  try {
    const Project = getProjectModel();
    const project = await Project.findOne({
      project_code: req.tenant.projectCode,
    }).lean();

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        project_code: project.project_code,
        client_name: project.client_name,
        config: project.config || {},
        editable_fields: EDITABLE_FIELDS,
      },
    });
  } catch (error) {
    console.error('Get project settings error:', error);
    res.status(500).json({ success: false, message: 'Error fetching project settings', error: error.message });
  }
});

// @route   PUT /api/admin/project-settings
// @desc    Update branding/app config of the currently selected project
// @access  Admin (dynamicSection edit)
router.put('/', edit, async (req, res) => {
  try {
    const body = req.body || {};
    const $set = {};

    for (const field of EDITABLE_FIELDS) {
      if (!(field in body)) continue;
      const value = body[field] === null ? '' : String(body[field]).trim();

      if (value && COLOR_FIELDS.includes(field) && !HEX_COLOR.test(value)) {
        return res.status(400).json({
          success: false,
          message: `${field} must be a hex color like #RRGGBB`,
        });
      }
      $set[`config.${field}`] = value;
    }

    if (Object.keys($set).length === 0) {
      return res.status(400).json({ success: false, message: 'No editable fields provided' });
    }

    const Project = getProjectModel();
    const project = await Project.findOneAndUpdate(
      { project_code: req.tenant.projectCode },
      { $set },
      { new: true, runValidators: true }
    ).lean();

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Project settings saved successfully',
      data: {
        project_code: project.project_code,
        client_name: project.client_name,
        config: project.config || {},
      },
    });
  } catch (error) {
    console.error('Update project settings error:', error);
    res.status(500).json({ success: false, message: 'Error saving project settings', error: error.message });
  }
});

module.exports = router;
