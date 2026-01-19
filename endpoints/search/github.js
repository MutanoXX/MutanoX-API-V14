import { get } from '../../utils/fetch.js';
import { validateParams } from '../../utils/validator.js';
import { successResponse, validationErrorResponse, errorResponse } from '../../utils/response.js';

/**
 * GitHub Search Endpoint
 * GET /api/search/github
 */
export const githubSearch = async (req, res) => {
  try {
    const { username, apikey } = req.query;

    // Validate required parameters
    const validation = validateParams({ username }, ['username']);
    if (!validation.isValid) {
      return validationErrorResponse(res, 'Missing required parameter: username', validation.missing);
    }

    const finalApikey = apikey || 'freeApikey';

    // Build URL
    const externalUrl = `https://anabot.my.id/api/search/githubSearch?username=${encodeURIComponent(username)}&apikey=${encodeURIComponent(finalApikey)}`;

    // Fetch data
    const result = await get(externalUrl);

    if (!result.success) {
      return errorResponse(res, 'Failed to search GitHub', result.error);
    }

    return successResponse(res, result.data, 'GitHub search completed successfully');
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};
