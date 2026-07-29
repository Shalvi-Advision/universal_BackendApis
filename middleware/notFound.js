// Unknown route. The status must live on the error itself — errorHandler reads
// err.statusCode, and a bare res.status(404) here was overwritten by its
// `|| 500` fallback, which turned every unknown route into a 500.
const notFound = (req, res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

module.exports = notFound;
