const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = {
      message,
      statusCode: 404,
    };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    error = {
      message,
      statusCode: 409,
    };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((val) => ({
      field: val.path,
      message: val.message,
    }));
    error = {
      message: 'Validation failed',
      statusCode: 400,
      errors,
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      message: 'Invalid token',
      statusCode: 401,
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      message: 'Token expired',
      statusCode: 401,
    };
  }

  if (err.name === 'MulterError') {
    error = {
      message: err.code === 'LIMIT_FILE_SIZE'
        ? 'An uploaded image exceeds the maximum file size'
        : 'The uploaded files could not be processed',
      statusCode: 400,
    };
  }

  const statusCode = error.statusCode || 500;
  const isServerError = statusCode >= 500;

  if (isServerError && process.env.NODE_ENV !== 'test') {
    console.error(`[${req.id || 'no-request-id'}]`, err);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message: isServerError && process.env.NODE_ENV === 'production'
        ? 'An unexpected server error occurred'
        : (error.message || 'Server Error'),
      statusCode,
      ...(error.errors && { errors: error.errors }),
      ...(req.id && { requestId: req.id }),
    },
  });
};

module.exports = errorHandler;
