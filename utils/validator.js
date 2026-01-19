/**
 * Validates required parameters
 * @param {Object} params - Parameters to validate
 * @param {string[]} required - Array of required parameter names
 * @returns {Object} - Validation result with isValid and missing fields
 */
export const validateParams = (params, required) => {
  const missing = [];

  for (const param of required) {
    if (!params[param] || params[param] === '' || params[param] === undefined) {
      missing.push(param);
    }
  }

  return {
    isValid: missing.length === 0,
    missing,
    hasErrors: missing.length > 0
  };
};

/**
 * Validates CPF (Brazilian tax ID)
 * @param {string} cpf - CPF to validate
 * @returns {boolean}
 */
export const validateCPF = (cpf) => {
  if (!cpf || typeof cpf !== 'string') return false;

  cpf = cpf.replace(/[^\d]/g, '');

  if (cpf.length !== 11) return false;

  if (/^(\d)\1{10}$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cpf.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;

  return digit === parseInt(cpf.charAt(10));
};

/**
 * Validates phone number (Brazilian)
 * @param {string} phone - Phone number to validate
 * @returns {boolean}
 */
export const validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;

  const cleaned = phone.replace(/[^\d]/g, '');
  return cleaned.length >= 10 && cleaned.length <= 11;
};

/**
 * Sanitizes user input to prevent XSS
 * @param {string} input - Input to sanitize
 * @returns {string}
 */
export const sanitizeInput = (input) => {
  if (!input || typeof input !== 'string') return input;
  return input.replace(/[<>]/g, '');
};
