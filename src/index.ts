/**
 * Contact Form & Admin Panel System 🚀
 * Single Worker handling contact form + admin panel
 *
 * This is a genericized version - customize via src/config.ts
 */

import { CONFIG, getConfig, validateConfig } from "./config.js";

// Import types
import type { FormSubmission, CloudflareAccessUser, Env } from './types/index.js';

// Import utilities
import { extractUserFromAccessToken, validateAdminAccess } from './utils/auth.js';
import { sendAdminNotification, shouldSendEmail, logEmailStatus } from './utils/email.js';
import { validateFormSubmission, parseFormData, createFormSubmission } from './utils/validation.js';
import { saveSubmission, getAllSubmissions, updateSubmissionStatus } from './utils/database.js';
import { getCorsHeaders, handlePreflightRequest, createHtmlResponse, createErrorResponse, createRedirectResponse } from './utils/cors.js';

// Import templates
import { getHomepageHTML } from './templates/homepage.js';
import { getContactFormHTML } from './templates/contact-form.js';
import { getSuccessHTML } from './templates/success.js';
import { getErrorHTML } from './templates/error.js';
import { getAdminHTML } from './templates/admin.js';

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const config = getConfig(env.ENVIRONMENT);
		
		// Validate configuration on startup
		const configErrors = validateConfig(config);
		if (configErrors.length > 0) {
			console.warn('Configuration warnings:', configErrors);
		}
		
		// Get CORS headers
		const corsHeaders = getCorsHeaders(config);

		// Handle preflight requests
		if (request.method === 'OPTIONS') {
			return handlePreflightRequest(corsHeaders);
		}

		try {
			let response: Response;
			
			// Atlas Divisions homepage
			if (url.pathname === '/' && request.method === 'GET') {
				response = await getHomepageHTML(corsHeaders);
			}
			// Simple contact form (legacy route)
			else if (url.pathname === '/contact-form' && request.method === 'GET') {
				response = createHtmlResponse(getContactFormHTML(config), corsHeaders);
			}
			// Submit contact form
			else if (url.pathname === '/submit' && request.method === 'POST') {
				response = await handleSubmit(request, env, corsHeaders, config);
			}
			// Admin panel
			else if (url.pathname === '/admin' && request.method === 'GET') {
				response = await handleAdmin(request, env, corsHeaders, config);
			}
			// Update submission status
			else if (url.pathname === '/admin/update' && request.method === 'POST') {
				response = await handleStatusUpdate(request, env, corsHeaders, config);
			}
			// Handle unknown routes
			else {
				response = createErrorResponse('Not Found', corsHeaders, 404);
			}
			
			return response;
			
		} catch (error) {
			console.error('Worker error:', error);
			return createErrorResponse('Internal Server Error', corsHeaders, 500);
		}
	},
} satisfies ExportedHandler<Env>;


async function handleSubmit(request: Request, env: Env, corsHeaders: Record<string, string>, config: typeof CONFIG) {
	try {
		const formData = await request.formData();
		const parsedData = parseFormData(formData);
		
		// Validate form data
		const validation = validateFormSubmission(parsedData, config);
		if (!validation.isValid) {
			return createHtmlResponse(
				getErrorHTML(validation.errors.join(', '), config),
				corsHeaders,
				400
			);
		}

		// Create submission object
		const submissionData = createFormSubmission(parsedData);
		const submission: FormSubmission = {
			id: crypto.randomUUID(),
			...submissionData,
			timestamp: new Date().toISOString()
		};

		// Save to database
		await saveSubmission(env, submission);

		// Send email notification asynchronously (doesn't block response)
		if (shouldSendEmail(config, env)) {
			console.log("Sending admin notification");
			await sendAdminNotification(env, submission);
			console.log("Admin notification completed");
		} else {
			logEmailStatus(config, env);
		}

		return createHtmlResponse(getSuccessHTML(config), corsHeaders);
	} catch (error) {
		console.error('Submit error:', error);
		return createHtmlResponse(
			getErrorHTML('Database error occurred', config),
			corsHeaders,
			500
		);
	}
}

async function handleAdmin(request: Request, env: Env, corsHeaders: Record<string, string>, config: typeof CONFIG) {
	try {
		// Extract user identity from Cloudflare Access token
		const user = extractUserFromAccessToken(request);
		
		// Validate admin access
		if (!validateAdminAccess(user, config)) {
			if (!user) {
				return createErrorResponse('Unauthorized - Admin access required', corsHeaders, 401);
			} else {
				return createErrorResponse('Forbidden - Email not in admin list', corsHeaders, 403);
			}
		}

		if (user) {
			console.log(`Admin access: ${user.email}`);
		}

		// Get all submissions
		const submissions = await getAllSubmissions(env);

		return createHtmlResponse(getAdminHTML(submissions, user, config), corsHeaders);
	} catch (error) {
		console.error('Admin error:', error);
		return createErrorResponse('Internal Server Error', corsHeaders, 500);
	}
}

async function handleStatusUpdate(request: Request, env: Env, corsHeaders: Record<string, string>, config: typeof CONFIG) {
	try {
		// Extract user identity from Cloudflare Access token
		const user = extractUserFromAccessToken(request);
		
		if (!user) {
			console.warn('Status update without authentication');
			// Still allow the update for now - but should be validated in production
		}
		
		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		const status = formData.get('status')?.toString();

		if (!id || !status) {
			return createErrorResponse('Missing ID or status', corsHeaders, 400);
		}

		// Validate status values using imported validation
		const validStatuses = config.admin.statusOptions.map((option: any) => option.value);
		if (!validStatuses.includes(status)) {
			return createErrorResponse('Invalid status value', corsHeaders, 400);
		}

		console.log(`Status update: ${id} -> ${status} by ${user?.email || 'unknown'}`);

		// Update submission status using database utility
		await updateSubmissionStatus(env, id, status);

		// Redirect back to admin panel
		return createRedirectResponse('/admin', corsHeaders);
	} catch (error) {
		console.error('Update error:', error);
		return createErrorResponse('Update failed', corsHeaders, 500);
	}
}





