import { get } from '../../utils/fetch.js';
import { validateParams } from '../../utils/validator.js';
import { successResponse, validationErrorResponse, errorResponse } from '../../utils/response.js';

/**
 * Cloudflare Bypass Endpoint
 * GET /api/tools/bypass
 */
export const bypassCloudflare = async (req, res) => {
  try {
    const { url, siteKey, type, proxy, apikey } = req.query;

    // Validate required parameters
    const validation = validateParams({ url, type, apikey }, ['url', 'type', 'apikey']);
    if (!validation.isValid) {
      return validationErrorResponse(res, 'Missing required parameters', validation.missing);
    }

    // Set default values
    const finalSiteKey = siteKey || '0x4AAAAAAAdJZmNxW54o-Gvd';
    const finalProxy = proxy || '';
    const finalApikey = apikey || 'freeApikey';

    // Build URL
    const externalUrl = `https://anabot.my.id/api/tools/bypass?url=${encodeURIComponent(url)}&siteKey=${encodeURIComponent(finalSiteKey)}&type=${encodeURIComponent(type)}&proxy=${encodeURIComponent(finalProxy)}&apikey=${encodeURIComponent(finalApikey)}`;

    // Fetch data
    const result = await get(externalUrl);

    if (!result.success) {
      return errorResponse(res, 'Failed to bypass Cloudflare', result.error);
    }

    return successResponse(res, result.data, 'Cloudflare bypass completed successfully');
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};
