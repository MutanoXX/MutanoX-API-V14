import { get } from '../../utils/fetch.js';
import { validateParams, sanitizeInput } from '../../utils/validator.js';
import { successResponse, validationErrorResponse, errorResponse } from '../../utils/response.js';

/**
 * Full Name Query Endpoint
 * GET /api/br/nome-completo
 */
export const queryFullName = async (req, res) => {
  try {
    const { q } = req.query;

    // Validate required parameters
    const validation = validateParams({ q }, ['q']);
    if (!validation.isValid) {
      return validationErrorResponse(res, 'Missing required parameter: q (full name)', validation.missing);
    }

    // Sanitize input
    const sanitizedName = sanitizeInput(q);

    if (sanitizedName.length < 3) {
      return errorResponse(res, 'Name must be at least 3 characters long');
    }

    // Build URL
    const externalUrl = `https://world-ecletix.onrender.com/api/nome-completo?q=${encodeURIComponent(sanitizedName)}`;

    // Fetch data
    const result = await get(externalUrl);

    if (!result.success) {
      return errorResponse(res, 'Failed to query name', result.error);
    }

    return successResponse(res, result.data, 'Name information retrieved successfully');
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};
