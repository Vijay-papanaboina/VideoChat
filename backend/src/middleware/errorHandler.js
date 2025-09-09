// Global error handling middleware

export const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // Default error
  let error = {
    success: false,
    message: "Internal server error",
    status: 500,
  };

  // Mongoose validation error
  if (err.name === "ValidationError") {
    error.message = "Validation error";
    error.status = 400;
    error.errors = Object.values(err.errors).map((val) => val.message);
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    error.message = "Invalid token";
    error.status = 401;
  }

  if (err.name === "TokenExpiredError") {
    error.message = "Token expired";
    error.status = 401;
  }

  // Duplicate key error
  if (err.code === 11000) {
    error.message = "Duplicate field value";
    error.status = 400;
  }

  // Cast error
  if (err.name === "CastError") {
    error.message = "Invalid ID format";
    error.status = 400;
  }

  // Custom error with status
  if (err.status) {
    error.status = err.status;
    error.message = err.message;
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === "production" && error.status === 500) {
    error.message = "Something went wrong";
    error.errors = undefined;
  }

  res.status(error.status).json({
    success: error.success,
    message: error.message,
    ...(error.errors && { errors: error.errors }),
  });
};

// 404 handler
export const notFound = (req, res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

// Async error wrapper
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
