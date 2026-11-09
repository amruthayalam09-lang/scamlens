/**
 * Centralized API Client for ScamLens Frontend
 * 
 * Configured to connect to the deployed Render backend:
 * https://scamlens-2rww.onrender.com
 * 
 * Safely handles empty, HTML, and network error responses without crashing on response.json().
 */

// Deployed Render backend URL as primary default, overrideable via VITE_API_URL
export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'https://scamlens-2rww.onrender.com'
).replace(/\/+$/, '');

/**
 * Returns the fully qualified API URL for an endpoint
 */
export function getApiUrl(endpoint) {
  if (!endpoint) return API_BASE_URL;
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
}

/**
 * Executes a network request with robust response parsing and friendly error messaging.
 * Completely eliminates "Failed to execute 'json' on 'Response': Unexpected end of JSON input".
 *
 * @param {string} endpoint The API path (e.g. '/api/analyze')
 * @param {Object} options Standard fetch options (method, headers, body, signal)
 * @returns {Promise<Object>} Parsed JSON response payload
 */
export async function apiRequest(endpoint, options = {}) {
  const url = getApiUrl(endpoint);

  const defaultHeaders = {
    'Accept': 'application/json'
  };

  if (options.body && typeof options.body === 'string') {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const mergedOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  };

  let response;
  try {
    response = await fetch(url, mergedOptions);
  } catch (networkError) {
    // Check if the user aborted via timeout controller
    if (networkError.name === 'AbortError') {
      throw networkError;
    }
    console.error(`[ScamLens API] Network error connecting to ${url}:`, networkError);
    throw new Error(
      `Could not connect to the Render backend at ${API_BASE_URL}. ` +
      `If the server was sleeping (Render free tier), it may take 30-40 seconds to spin up. Please check your internet and retry.`
    );
  }

  // 1. Read as text first to prevent JSON syntax crash on empty responses
  let rawText = '';
  try {
    rawText = await response.text();
  } catch (readError) {
    console.error('[ScamLens API] Error reading response stream:', readError);
    throw new Error('Failed to read response data from server. Please retry.');
  }

  // 2. Handle empty response body gracefully
  if (!rawText || !rawText.trim()) {
    if (response.ok) {
      return { success: true };
    }
    throw new Error(
      `The backend server returned an empty response (HTTP ${response.status}). ` +
      `The Render instance may still be waking up. Please retry in 15 seconds.`
    );
  }

  // 3. Parse JSON safely
  let data;
  try {
    data = JSON.parse(rawText);
  } catch (parseError) {
    // Check if Render or Cloudflare returned an HTML error page (e.g. 502/503/504)
    if (rawText.trim().startsWith('<')) {
      throw new Error(
        `Backend server returned an HTML error page (HTTP ${response.status}). ` +
        `The Render service (https://scamlens-2rww.onrender.com) is likely waking up. Please wait 15 seconds and try again.`
      );
    }
    throw new Error(
      `Server returned an unparseable response (HTTP ${response.status}): ${rawText.slice(0, 100)}`
    );
  }

  // 4. Handle non-2xx status codes with informative messages
  if (!response.ok) {
    const errorMsg =
      data.message ||
      data.error ||
      `Server responded with HTTP ${response.status}: ${response.statusText || 'Error'}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}
