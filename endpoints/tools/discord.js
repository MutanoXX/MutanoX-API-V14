import { get } from '../../utils/fetch.js';
import { validateParams } from '../../utils/validator.js';
import { successResponse, validationErrorResponse, errorResponse } from '../../utils/response.js';

/**
 * Discord Stalk Endpoint
 * GET /api/tools/stalkDiscord
 */
export const stalkDiscord = async (req, res) => {
  try {
    const { id, apikey } = req.query;

    // Validate required parameters
    const validation = validateParams({ id }, ['id']);
    if (!validation.isValid) {
      return validationErrorResponse(res, 'Missing required parameters', validation.missing);
    }

    // Set default API key
    const finalApikey = apikey || 'MutanoX';

    // Build URL
    const externalUrl = `https://anabot.my.id/api/tools/stalkDiscord?id=${encodeURIComponent(id)}&apikey=${encodeURIComponent(finalApikey)}`;

    // Fetch data
    const result = await get(externalUrl);

    if (!result.success) {
      return errorResponse(res, 'Failed to stalk Discord user', result.error);
    }

    return successResponse(res, result.data, 'Discord user information retrieved successfully');
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};
