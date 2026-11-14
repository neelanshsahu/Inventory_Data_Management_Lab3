function notFound(req, res, next) {
  res.status(404);
  next(new Error(`Route not found: ${req.originalUrl}`));
}

function errorHandler(err, req, res, next) {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || "Internal server error";

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors).map((item) => item.message).join(", ");
  }

  if (err.code === 11000) {
    statusCode = 409;
    message = "SKU already exists";
  }

  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid product ID";
  }

  console.error(err.message);
  res.status(statusCode).json({ message });
}

module.exports = { notFound, errorHandler };
