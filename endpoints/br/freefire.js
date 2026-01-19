import { get } from '../../utils/fetch.js';
import { validateParams } from '../../utils/validator.js';
import { successResponse, validationErrorResponse, errorResponse } from '../../utils/response.js';

/**
 * Free Fire Info Endpoint
 * GET /api/br/infoff
 */
export const getFreeFireInfo = async (req, res) => {
  try {
    const { id } = req.query;

    // Validate required parameters
    const validation = validateParams({ id }, ['id']);
    if (!validation.isValid) {
      return validationErrorResponse(res, 'Missing required parameters: id', validation.missing);
    }

    // Build URL
    const externalUrl = `https://world-ecletix.onrender.com/api/infoff?id=${encodeURIComponent(id)}`;

    // Fetch data
    const result = await get(externalUrl);

    if (!result.success) {
      return errorResponse(res, 'Failed to fetch Free Fire info', result.error);
    }

    return successResponse(res, result.data, 'Free Fire account information retrieved successfully');
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};
