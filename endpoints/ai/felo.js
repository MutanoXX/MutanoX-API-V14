import { get } from '../../utils/fetch.js';
import { validateParams } from '../../utils/validator.js';
import { successResponse, validationErrorResponse, errorResponse } from '../../utils/response.js';

/**
 * Felo AI Endpoint
 * GET /api/ai/felo
 */
export const feloAI = async (req, res) => {
  try {
    const { prompt, apikey } = req.query;

    // Validate required parameters
    const validation = validateParams({ prompt }, ['prompt']);
    if (!validation.isValid) {
      return validationErrorResponse(res, 'Missing required parameter: prompt', validation.missing);
    }

    const finalApikey = apikey || 'freeApikey';

    // Build URL
    const externalUrl = `https://anabot.my.id/api/ai/felo?prompt=${encodeURIComponent(prompt)}&apikey=${encodeURIComponent(finalApikey)}`;

    // Fetch data
    const result = await get(externalUrl);

    if (!result.success) {
      return errorResponse(res, 'Failed to get Felo AI response', result.error);
    }

    return successResponse(res, result.data, 'Felo AI response generated successfully');
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};
