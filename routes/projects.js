const express = require('express');
const { protect } = require('../middleware/auth');
const { getProjectModel } = require('../models/Project');

const router = express.Router();

// GET /api/projects
// Active clients from the tenant registry — powers the admin panel's project
// switcher. JWT-protected so only logged-in admins can enumerate clients.
router.get('/', protect, async (req, res, next) => {
  try {
    const Project = getProjectModel();

    // Super admins see every client; scoped admins only their assigned ones
    const filter = { status: 'active' };
    if (!req.user.isSuperAdmin) {
      filter.project_code = { $in: req.user.allowed_project_codes || [] };
    }

    const projects = await Project.find(filter)
      .select('project_code client_name config.app_name -_id')
      .sort({ client_name: 1 })
      .lean();

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
