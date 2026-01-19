/**
 * Makes HTTP GET request
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>}
 */
export const get = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      method: 'GET',
      ...options,
      headers: {
        'User-Agent': 'MutanoX-API/14.0.0',
        ...options.headers
      }
    });

    const data = await response.json();
    return {
      success: true,
      data,
      status: response.status
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

/**
 * Makes HTTP POST request
 * @param {string} url - URL to fetch
 * @param {Object} body - Request body
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>}
 */
export const post = async (url, body, options = {}) => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MutanoX-API/14.0.0',
        ...options.headers
      },
      body: JSON.stringify(body),
      ...options
    });

    const data = await response.json();
    return {
      success: true,
      data,
      status: response.status
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

/**
 * Parse result from external API
 * @param {Object} result - Result from get/post function
 * @returns {Object} - Standardized response
 */
export const parseResult = (result) => {
  if (!result.success) {
    return {
      success: false,
      error: result.error,
      message: 'Failed to fetch data from external API'
    };
  }

  return {
    success: true,
    data: result.data
  };
};
