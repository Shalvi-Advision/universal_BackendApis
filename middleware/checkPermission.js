/**
 * Granular permission middleware.
 * Must be used AFTER protect + authorize('admin') so req.user is guaranteed.
 */
const checkPermission = (section, action) => {
  return (req, res, next) => {
    // Super admins bypass all permission checks
    if (req.user.isSuperAdmin) return next();

    const sectionPerms = req.user.permissions?.[section];
    if (!sectionPerms || !sectionPerms[action]) {
      return res.status(403).json({
        success: false,
        message: `You do not have permission to ${action} in ${section}`
      });
    }

    next();
  };
};

const requireSuperAdmin = (req, res, next) => {
  if (!req.user.isSuperAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Super admin access required'
    });
  }
  next();
};

/**
 * Tenant scoping for admins. Super admins may operate on any project;
 * other admins only on projects listed in their allowed_project_codes.
 * Must run AFTER protect + the tenant resolver.
 */
const requireProjectAccess = (req, res, next) => {
  if (req.user.isSuperAdmin) return next();

  const projectCode = req.tenant?.projectCode;
  const allowed = req.user.allowed_project_codes || [];

  if (!projectCode || !allowed.includes(projectCode)) {
    return res.status(403).json({
      success: false,
      message: `You do not have access to project ${projectCode || '(unknown)'}`
    });
  }

  next();
};

module.exports = { checkPermission, requireSuperAdmin, requireProjectAccess };
