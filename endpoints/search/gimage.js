import { get } from '../../utils/fetch.js';
import { validateParams } from '../../utils/validator.js';
import { successResponse, validationErrorResponse, errorResponse } from '../../utils/response.js';

/**
 * Google Image Search Endpoint
 * GET /api/search/gimage
 */
export const googleImageSearch = async (req, res) => {
  try {
    const { query, apikey } = req.query;

    // Validate required parameters
    const validation = validateParams({ query }, ['query']);
    if (!validation.isValid) {
      return validationErrorResponse(res, 'Missing required parameter: query', validation.missing);
    }

    const finalApikey = apikey || 'freeApikey';

    // Build URL
    const externalUrl = `https://anabot.my.id/api/search/gimage?query=${encodeURIComponent(query)}&apikey=${encodeURIComponent(finalApikey)}`;

    // Fetch data
    const result = await get(externalUrl);

    if (!result.success) {
      return errorResponse(res, 'Failed to search Google Images', result.error);
    }

    return successResponse(res, result.data, 'Google Image search completed successfully');
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};
