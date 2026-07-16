const express = require('express');

const router = express.Router();

// GET /api/project-config
// Public, frontend-safe branding/runtime config for the resolved tenant.
// The single mobile app / admin panel calls this at boot to configure itself.
router.get('/', (req, res) => {
  const { project, projectCode } = req.tenant;

  res.status(200).json({
    success: true,
    data: {
      project_code: projectCode,
      client_name: project.client_name,
      config: project.config || {},
    },
  });
});

module.exports = router;
