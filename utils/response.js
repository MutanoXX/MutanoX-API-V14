/**
 * Standard error response
 */
export const errorResponse = (res, message, statusCode = 400, error = null) => {
  const response = {
    success: false,
    message,
    error: error?.message || error
  };

  res.status(statusCode).json(response);
};

/**
 * Standard success response
 */
export const successResponse = (res, data, message = 'Success') => {
  const response = {
    success: true,
    message,
    data
  };

  res.json(response);
};

/**
 * Not found response
 */
export const notFoundResponse = (res, message = 'Resource not found') => {
  return errorResponse(res, message, 404);
};

/**
 * Server error response
 */
export const serverErrorResponse = (res, error) => {
  console.error('Server error:', error);
  return errorResponse(res, 'Internal server error', 500, error);
};

/**
 * Validation error response
 */
export const validationErrorResponse = (res, message, missingFields = []) => {
  const response = {
    success: false,
    message,
    missingFields
  };

  res.status(400).json(response);
};
