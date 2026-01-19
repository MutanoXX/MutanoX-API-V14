import { get } from '../../utils/fetch.js';
import { validateParams, validateCPF, sanitizeInput } from '../../utils/validator.js';
import { successResponse, validationErrorResponse, errorResponse } from '../../utils/response.js';

/**
 * CPF Query Endpoint
 * GET /api/br/consultarcpf
 */
export const queryCPF = async (req, res) => {
  try {
    const { cpf } = req.query;

    // Validate required parameters
    const validation = validateParams({ cpf }, ['cpf']);
    if (!validation.isValid) {
      return validationErrorResponse(res, 'Missing required parameter: cpf', validation.missing);
    }

    // Sanitize and validate CPF
    const sanitizedCPF = sanitizeInput(cpf).replace(/[^\d]/g, '');

    if (!validateCPF(sanitizedCPF)) {
      return errorResponse(res, 'Invalid CPF format');
    }

    // Build URL
    const externalUrl = `https://world-ecletix.onrender.com/api/consultarcpf?cpf=${encodeURIComponent(sanitizedCPF)}`;

    // Fetch data
    const result = await get(externalUrl);

    if (!result.success) {
      return errorResponse(res, 'Failed to query CPF', result.error);
    }

    return successResponse(res, result.data, 'CPF information retrieved successfully');
  } catch (error) {
    return errorResponse(res, 'Internal server error', 500, error);
  }
};
