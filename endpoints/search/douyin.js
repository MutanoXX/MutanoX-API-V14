import { get } from '../../utils/fetch.js';
import { validateParams } from '../../utils/validator.js';
import { successResponse, validationErrorResponse, errorResponse } from '../../utils/response.js';

/**
 * Douyin Search Endpoint
 * GET /api/search/douyin
 */
export const douyinSearch = async (req, res) => {
  try {
    const { query, apikey } = req.query;

    // Validate required parameters
    const validation = validateParams({ query }, ['query']);
    if (!validation.isValid) {
      return validationErrorResponse(res, 'Missing required parameter: query', validation.missing);
    }

    const finalApikey = apikey || 'freeApikey';

    // Build URL
    const externalUrl = `https://anabot.my.id/api/search/douyin?query=${encodeURIComponent(query)}&apikey=${encodeURIComponent(finalApikey)}`;

    // Fetch data
    const result = await get(externalUrl);

    if (!result.success) {
      return errorResponse(res, 'Failed to search Douyin', result.error);
    }

    return successResponse(res, result.data, 'Douyin search completed successfully');
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};
