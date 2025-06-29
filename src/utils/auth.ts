/**
 * Authentication Utilities
 */

import type { CloudflareAccessUser } from '../types/index.js';
import type { CONFIG } from '../config.js';

/**
 * Extract user identity from Cloudflare Access JWT token
 * @param request - The incoming request
 * @returns CloudflareAccessUser object or null if token is missing/invalid
 */
export function extractUserFromAccessToken(request: Request): CloudflareAccessUser | null {
  try {
    const userJWT = request.headers.get('Cf-Access-Jwt-Assertion');
    if (!userJWT) {
      return null;
    }

    // JWT structure: header.payload.signature
    const parts = userJWT.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT token format');
      return null;
    }

    // Decode the payload (base64url decode)
    const payload = parts[1];
    // Convert base64url to base64
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    
    const decodedPayload = JSON.parse(atob(paddedBase64));
    
    // Validate token expiration
    if (decodedPayload.exp && decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      console.warn('JWT token expired');
      return null;
    }
    
    // Validate required fields
    if (!decodedPayload.email) {
      console.error('JWT token missing email field');
      return null;
    }

    return {
      email: decodedPayload.email,
      name: decodedPayload.name,
      sub: decodedPayload.sub,
      aud: decodedPayload.aud,
      iss: decodedPayload.iss,
      iat: decodedPayload.iat,
      exp: decodedPayload.exp
    };
  } catch (error) {
    console.error('Error extracting user from Access token:', error);
    return null;
  }
}

/**
 * Validate admin access based on configuration and user
 * @param user - CloudflareAccessUser or null
 * @param config - Application configuration
 * @returns boolean indicating if user has admin access
 */
export function validateAdminAccess(user: CloudflareAccessUser | null, config: typeof CONFIG): boolean {
  // If admin auth is disabled, allow access
  if (!config.features.enableAdminAuth) {
    return true;
  }

  // If no user and Cloudflare Access is enabled, deny access
  if (!user && config.features.enableCloudflareAccess) {
    return false;
  }

  // If not using Cloudflare Access, check email allowlist
  if (!config.features.enableCloudflareAccess && user) {
    return config.security.allowedAdminEmails.includes(user.email);
  }

  // If using Cloudflare Access and user exists, allow access
  return !!user;
}

/**
 * Create authentication response headers
 * @param corsHeaders - Existing CORS headers
 * @returns Response object for authentication failures
 */
export function createAuthFailureResponse(corsHeaders: Record<string, string>, message = 'Unauthorized'): Response {
  return new Response(message, {
    status: 401,
    headers: corsHeaders
  });
}

/**
 * Create forbidden response headers
 * @param corsHeaders - Existing CORS headers
 * @returns Response object for forbidden access
 */
export function createForbiddenResponse(corsHeaders: Record<string, string>, message = 'Forbidden'): Response {
  return new Response(message, {
    status: 403,
    headers: corsHeaders
  });
}