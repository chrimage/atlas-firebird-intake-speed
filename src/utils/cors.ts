/**
 * CORS Utilities
 */

import type { CONFIG } from '../config.js';

/**
 * Generate CORS headers from configuration
 * @param config - Application configuration
 * @returns CORS headers object
 */
export function getCorsHeaders(config: typeof CONFIG): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': config.security.cors.allowedOrigins.join(', '),
    'Access-Control-Allow-Methods': config.security.cors.allowedMethods.join(', '),
    'Access-Control-Allow-Headers': config.security.cors.allowedHeaders.join(', '),
  };
}

/**
 * Handle preflight OPTIONS request
 * @param corsHeaders - CORS headers to include
 * @returns Response for preflight request
 */
export function handlePreflightRequest(corsHeaders: Record<string, string>): Response {
  return new Response(null, { headers: corsHeaders });
}

/**
 * Add CORS headers to existing response
 * @param response - Original response
 * @param corsHeaders - CORS headers to add
 * @returns Response with CORS headers added
 */
export function addCorsHeaders(response: Response, corsHeaders: Record<string, string>): Response {
  const newHeaders = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}

/**
 * Create JSON response with CORS headers
 * @param data - Data to serialize as JSON
 * @param corsHeaders - CORS headers to include
 * @param status - HTTP status code (default: 200)
 * @returns JSON response with CORS headers
 */
export function createJsonResponse(
  data: any, 
  corsHeaders: Record<string, string>, 
  status = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

/**
 * Create HTML response with CORS headers
 * @param html - HTML content
 * @param corsHeaders - CORS headers to include
 * @param status - HTTP status code (default: 200)
 * @returns HTML response with CORS headers
 */
export function createHtmlResponse(
  html: string, 
  corsHeaders: Record<string, string>, 
  status = 200
): Response {
  return new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html',
      ...corsHeaders
    }
  });
}

/**
 * Create error response with CORS headers
 * @param message - Error message
 * @param corsHeaders - CORS headers to include
 * @param status - HTTP status code (default: 500)
 * @returns Error response with CORS headers
 */
export function createErrorResponse(
  message: string, 
  corsHeaders: Record<string, string>, 
  status = 500
): Response {
  return new Response(message, {
    status,
    headers: corsHeaders
  });
}

/**
 * Create redirect response with CORS headers
 * @param location - URL to redirect to
 * @param corsHeaders - CORS headers to include
 * @param status - HTTP status code (default: 302)
 * @returns Redirect response with CORS headers
 */
export function createRedirectResponse(
  location: string, 
  corsHeaders: Record<string, string>, 
  status = 302
): Response {
  return new Response('', {
    status,
    headers: {
      'Location': location,
      ...corsHeaders
    }
  });
}