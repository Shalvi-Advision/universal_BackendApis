const { validationResult } = require('express-validator');

// Turns express-validator's recorded errors into a 400.
//
// The validation chains were previously mounted without this step, so
// `body('mobile').matches(...)` recorded failures that nothing ever read —
// the rules were decorative and every handler fell back to its own hand-rolled
// checks. Mount this immediately after the chains on any route that uses them.
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  const details = errors.array().map((e) => ({
    field: e.path || e.param,
    message: e.msg,
  }));

  return res.status(400).json({
    success: false,
    message: details[0].message,
    details,
  });
};

module.exports = validate;
