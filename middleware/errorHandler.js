// Stack traces and raw error messages are opt-in, not environment-inferred.
// The deployed servers run with NODE_ENV=development, so keying this off the
// environment name published internal stacks to the public internet.
const exposeErrorDetail = () => process.env.EXPOSE_ERROR_DETAIL === 'true';

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Server Error';
  let details;

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    statusCode = 404;
    message = 'Resource not found';
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value entered';
  }

  // Mongoose validation error
  if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    message = Object.values(err.errors).map((val) => val.message).join(', ');
  }

  // express-validator failures forwarded via next()
  if (err.name === 'RequestValidationError' && Array.isArray(err.details)) {
    statusCode = 400;
    details = err.details;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Always log the full error server-side, with enough context to find it.
  const logLine = `${req.method} ${req.originalUrl} -> ${statusCode}`;
  if (statusCode >= 500) {
    console.error(`Error: ${logLine}`, err);
  } else {
    console.warn(`Warn: ${logLine} — ${message}`);
  }

  // A 5xx message is an internal detail (driver errors, stack frames, connection
  // strings). Client-caused 4xx messages are intentional and safe to return.
  const clientMessage =
    statusCode >= 500 && !exposeErrorDetail() ? 'Server Error' : message;

  res.status(statusCode).json({
    success: false,
    error: clientMessage,
    ...(details && { details }),
    ...(exposeErrorDetail() && { stack: err.stack })
  });
};

module.exports = errorHandler;
