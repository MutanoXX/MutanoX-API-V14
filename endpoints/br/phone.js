import { get } from '../../utils/fetch.js';
import { validateParams, validatePhone } from '../../utils/validator.js';
import { successResponse, validationErrorResponse, errorResponse } from '../../utils/response.js';

/**
 * Phone Number Query Endpoint
 * GET /api/br/numero
 */
export const queryPhone = async (req, res) => {
  try {
    const { q } = req.query;

    // Validate required parameters
    const validation = validateParams({ q }, ['q']);
    if (!validation.isValid) {
      return validationErrorResponse(res, 'Missing required parameter: q (phone number)', validation.missing);
    }

    // Validate phone format
    if (!validatePhone(q)) {
      return errorResponse(res, 'Invalid phone number format');
    }

    // Build URL
    const externalUrl = `https://world-ecletix.onrender.com/api/numero?q=${encodeURIComponent(q)}`;

    // Fetch data
    const result = await get(externalUrl);

    if (!result.success) {
      return errorResponse(res, 'Failed to query phone number', result.error);
    }

    return successResponse(res, result.data, 'Phone number information retrieved successfully');
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};
