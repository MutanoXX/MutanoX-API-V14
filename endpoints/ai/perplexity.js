import { get } from '../../utils/fetch.js';
import { validateParams } from '../../utils/validator.js';
import { successResponse, validationErrorResponse, errorResponse } from '../../utils/response.js';

/**
 * Perplexity AI Endpoint
 * GET /api/ai/perplexity
 */
export const perplexityAI = async (req, res) => {
  try {
    const { prompt, apikey } = req.query;

    // Validate required parameters
    const validation = validateParams({ prompt }, ['prompt']);
    if (!validation.isValid) {
      return validationErrorResponse(res, 'Missing required parameter: prompt', validation.missing);
    }

    const finalApikey = apikey || 'freeApikey';

    // Build URL
    const externalUrl = `https://anabot.my.id/api/ai/perplexity?prompt=${encodeURIComponent(prompt)}&apikey=${encodeURIComponent(finalApikey)}`;

    // Fetch data
    const result = await get(externalUrl);

    if (!result.success) {
      return errorResponse(res, 'Failed to get Perplexity response', result.error);
    }

    return successResponse(res, result.data, 'Perplexity AI response generated successfully');
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};
