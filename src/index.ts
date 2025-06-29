 /**
 * Contact Form & Admin Panel System 🚀
 * Single Worker handling contact form + admin panel
 *
 * This is a genericized version - customize via src/config.ts
 */

import { EmailMessage } from "cloudflare:email";
import { createMimeMessage } from "mimetext";
import { CONFIG, getConfig, validateConfig } from "./config";

interface FormSubmission {
id: string;
name: string;
email?: string;
phone?: string;
priority?: string;
service_type: string;
message: string;
timestamp: string;
}

interface CloudflareAccessUser {
	email: string;
	name?: string;
	sub?: string;
	aud?: string[];
	iss?: string;
	iat?: number;
	exp?: number;
}

interface Env {
DB: D1Database;
EMAIL_SENDER: any;        // New
FROM_EMAIL: string;       // New
ADMIN_EMAIL: string;      // New
ENVIRONMENT?: string;     // New
MG_DOMAIN: string;        // Mailgun domain
MG_API_KEY: string;       // Mailgun API key
}

/**
 * Extract user identity from Cloudflare Access JWT token
 * @param request - The incoming request
 * @returns CloudflareAccessUser object or null if token is missing/invalid
 */
function extractUserFromAccessToken(request: Request): CloudflareAccessUser | null {
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


async function sendAdminNotification(env: Env, submission: FormSubmission): Promise<void> {
  try {
    const config = getConfig(env.ENVIRONMENT);
    const subjectLine = createSubjectLine(submission, config);
    const emailContent = createEmailContent(submission, env, config);
    const domain = env.MG_DOMAIN;
    const apiKey = env.MG_API_KEY;
+   console.log(`🐝 Sending Mailgun email via domain: ${domain}`);
+   console.log(`🐝 API Key prefix: ${apiKey.slice(0, 8)}`);
    const params = new URLSearchParams({
      from: `Atlas Divisions <firebird@${domain}>`,
      to: env.ADMIN_EMAIL,
      subject: subjectLine,
      text: emailContent
    });
    const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + btoa(`api:${apiKey}`),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });
    if (!response.ok) {
      console.error(`❌ Email failed: ${response.status} ${response.statusText}`);
    } else {
      console.log(`✅ Mailgun email sent: ${response.status}`);
    }
  } catch (error) {
    console.error('Error sending Mailgun email:', error);
  }
}

function createSubjectLine(submission: FormSubmission, config: typeof CONFIG): string {
  const serviceType = submission.service_type || 'General';
  const customerName = submission.name || 'Unknown';
  const subject = `${config.email.subjectPrefix}: ${serviceType} - ${customerName}`;
  
  // Truncate to 78 characters for email compatibility
  return subject.length > 78 ? subject.substring(0, 75) + '...' : subject;
}

function createEmailContent(submission: FormSubmission, env: Env, config: typeof CONFIG): string {
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${config.company.emoji} ${config.email.templates.adminNotification.header}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 Customer: ${submission.name}
📧 Email: ${submission.email || 'Not provided'}
📱 Phone: ${submission.phone || 'Not provided'}
🔧 Service: ${submission.service_type}

💬 Message:
${submission.message}

🕒 Submitted: ${new Date(submission.timestamp).toLocaleString()}
🌐 Environment: ${env.ENVIRONMENT || 'production'}
📝 Submission ID: ${submission.id}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${config.email.templates.adminNotification.footer}
  `.trim();
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const config = getConfig(env.ENVIRONMENT);
		
		// Validate configuration on startup
		const configErrors = validateConfig(config);
		if (configErrors.length > 0) {
			console.warn('Configuration warnings:', configErrors);
		}
		
		// Add CORS headers for all responses
		const corsHeaders = {
			'Access-Control-Allow-Origin': config.security.cors.allowedOrigins.join(', '),
			'Access-Control-Allow-Methods': config.security.cors.allowedMethods.join(', '),
			'Access-Control-Allow-Headers': config.security.cors.allowedHeaders.join(', '),
		};

		// Handle preflight requests
		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		try {
			let response: Response;
			
			// Landing page with contact form
			if (url.pathname === '/' && request.method === 'GET') {
				response = new Response(getContactFormHTML(config), {
					headers: { 'Content-Type': 'text/html', ...corsHeaders }
				});
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
				response = new Response('Not Found', { status: 404, headers: corsHeaders });
			}
			
			return response;
			
		} catch (error) {
			console.error('Worker error:', error);
			return new Response('Internal Server Error', {
				status: 500,
				headers: corsHeaders
			});
		}
	},
} satisfies ExportedHandler<Env>;

async function handleSubmit(request: Request, env: Env, corsHeaders: Record<string, string>, config: typeof CONFIG) {
	try {
		const formData = await request.formData();
		const id = crypto.randomUUID();
		
		const name = formData.get('name')?.toString();
		const email = formData.get('email')?.toString();
		const phone = formData.get('phone')?.toString();
		const serviceType = formData.get('service_type')?.toString();
const priority = formData.get('priority')?.toString();
		const message = formData.get('message')?.toString();

		// Basic validation
		if (!name || !message || !serviceType) {
			return new Response(getErrorHTML('Name, service type, and message are required', config), {
				status: 400,
				headers: { 'Content-Type': 'text/html', ...corsHeaders }
			});
		}

		// Save to database
		const timestamp = new Date().toISOString();
		await env.DB.prepare(`
			INSERT INTO submissions (id, name, email, phone, service_type, message, status, priority, created_at)
			VALUES (?, ?, ?, ?, ?, ?, 'new', ?, datetime('now'))
		`).bind(id, name, email, phone, serviceType, message, priority).run();

		// After database save, add email notification
		const submission: FormSubmission = {
			id,
			name: name!,
			email: email || undefined,
			phone: phone || undefined,
			service_type: serviceType!,
			message: message!,
			timestamp
		};

		// Send email notification asynchronously (doesn't block response)
		if (config.features.enableEmailNotifications && env.EMAIL_SENDER && env.ADMIN_EMAIL) {
			console.log("Reaching sendAdminNotification");
			await sendAdminNotification(env, submission);
			console.log("sendAdminNotification completed");
		} else {
			console.log("EMAIL_SENDER or ADMIN_EMAIL not configured, or email notifications disabled");
		}

		return new Response(getSuccessHTML(config), {
			headers: { 'Content-Type': 'text/html', ...corsHeaders }
		});
	} catch (error) {
		console.error('Submit error:', error);
		return new Response(getErrorHTML('Database error occurred', config), {
			status: 500,
			headers: { 'Content-Type': 'text/html', ...corsHeaders }
		});
	}
}

async function handleAdmin(request: Request, env: Env, corsHeaders: Record<string, string>, config: typeof CONFIG) {
	try {
		// Extract user identity from Cloudflare Access token
		const user = extractUserFromAccessToken(request);
		
		if (!user) {
			console.warn('Missing Cf-Access-Jwt-Assertion header');
			// If admin auth is enabled and no Cloudflare Access, deny access
			if (config.features.enableAdminAuth && !config.features.enableCloudflareAccess) {
				return new Response('Unauthorized - Admin access required', {
					status: 401,
					headers: corsHeaders
				});
			}
		} else {
			console.log(`Admin access: ${user.email}`);
			// Check if user email is in allowed list (if not using Cloudflare Access)
			if (config.features.enableAdminAuth && !config.features.enableCloudflareAccess) {
				if (!config.security.allowedAdminEmails.includes(user.email)) {
					return new Response('Unauthorized - Email not in admin list', {
						status: 403,
						headers: corsHeaders
					});
				}
			}
		}

		const { results } = await env.DB.prepare(`
			SELECT * FROM submissions
			ORDER BY created_at DESC
		`).all();

		return new Response(getAdminHTML(results, user, config), {
			headers: { 'Content-Type': 'text/html', ...corsHeaders }
		});
	} catch (error) {
		console.error('Admin error:', error);
		return new Response('Internal Server Error', {
			status: 500,
			headers: corsHeaders
		});
	}
}

async function handleStatusUpdate(request: Request, env: Env, corsHeaders: Record<string, string>, config: typeof CONFIG) {
	try {
		// Extract user identity from Cloudflare Access token
		const user = extractUserFromAccessToken(request);
		
		if (!user) {
			console.warn('Status update without authentication');
			// Still allow the update for now
		}
		
		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		const status = formData.get('status')?.toString();

		if (!id || !status) {
			return new Response('Missing ID or status', {
				status: 400,
				headers: corsHeaders
			});
		}

		// Validate status values using config
		const validStatuses = config.admin.statusOptions.map(option => option.value);
		if (!validStatuses.includes(status)) {
			return new Response('Invalid status value', {
				status: 400,
				headers: corsHeaders
			});
		}

		console.log(`Status update: ${id} -> ${status} by ${user?.email || 'unknown'}`);

		await env.DB.prepare(`
			UPDATE submissions
			SET status = ?, updated_at = datetime('now')
			WHERE id = ?
		`).bind(status, id).run();

		// Redirect back to admin panel
		return new Response('', {
			status: 302,
			headers: { 'Location': '/admin', ...corsHeaders }
		});
	} catch (error) {
		console.error('Update error:', error);
		return new Response('Update failed', {
			status: 500,
			headers: corsHeaders
		});
	}
}

/**
 * Generate CSS custom properties from theme configuration
 */
function generateThemeCSS(config: typeof CONFIG): string {
	const colors = config.styling.colors;
	const effects = config.styling.effects;
	
	return `
		:root {
			/* Colors */
			--color-primary: ${colors.primary};
			--color-primary-hover: ${colors.primaryHover};
			--color-primary-light: ${colors.primaryLight};
			--color-primary-bg: ${colors.primaryBg};
			--color-accent: ${colors.accent};
			--color-accent-hover: ${colors.accentHover};
			--color-accent-light: ${colors.accentLight};
			--color-accent-dark: ${colors.accentDark};
			--color-success: ${colors.success};
			--color-success-hover: ${colors.successHover};
			--color-error: ${colors.error};
			--color-error-bg: ${colors.errorBg};
			--color-warning: ${colors.warning};
			--color-warning-bg: ${colors.warningBg};
			--color-text: ${colors.text};
			--color-text-light: ${colors.textLight};
			--color-text-inverse: ${colors.textInverse};
			--color-background: ${colors.background};
			--color-background-secondary: ${colors.backgroundSecondary};
			--color-background-dark: ${colors.backgroundDark};
			--color-surface: ${colors.surface};
			--color-surface-teal: ${colors.surfaceTeal};
			--color-surface-gold: ${colors.surfaceGold};
			--color-border: ${colors.border};
			--color-border-teal: ${colors.borderTeal};
			--color-border-gold: ${colors.borderGold};
			
			/* Gradients */
			--gradient-primary: ${colors.gradientPrimary};
			--gradient-accent: ${colors.gradientAccent};
			--gradient-dark: ${colors.gradientDark};
			--gradient-teal-gold: ${colors.gradientTealGold};
			
			/* Shadows */
			--shadow-teal: ${colors.shadowTeal};
			--shadow-gold: ${colors.shadowGold};
			--shadow-dark: ${colors.shadowDark};
			
			/* Effects */
			--border-radius: ${effects.borderRadius};
			--border-radius-large: ${effects.borderRadiusLarge};
			--border-radius-small: ${effects.borderRadiusSmall};
			--box-shadow: ${effects.boxShadow};
			--box-shadow-large: ${effects.boxShadowLarge};
			--transition: ${effects.transition};
			
			/* Fonts */
			--font-primary: ${config.styling.fonts.primary};
		}
	`.trim();
}

function getContactFormHTML(config: typeof CONFIG): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${config.company.name} - ${config.contactForm.title}</title>
	<style>
		${generateThemeCSS(config)}
		
		* { 
			box-sizing: border-box; 
		}
		
		body { 
			font-family: var(--font-primary);
			max-width: 600px; 
			margin: 50px auto; 
			padding: 20px;
			background: var(--gradient-primary);
			min-height: 100vh;
			background-attachment: fixed;
		}
		
		.container {
			background: var(--color-surface);
			padding: 40px;
			border-radius: var(--border-radius-large);
			box-shadow: var(--box-shadow-large);
			border: 1px solid var(--color-border-teal);
			backdrop-filter: blur(10px);
			position: relative;
			overflow: hidden;
		}
		
		.container::before {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			height: 4px;
			background: var(--gradient-accent);
			border-radius: var(--border-radius-large) var(--border-radius-large) 0 0;
		}
		
		h1 { 
			color: var(--color-text); 
			margin-bottom: 10px;
			font-size: 2rem;
			font-weight: 700;
			text-shadow: 0 2px 4px var(--shadow-teal);
		}
		
		.subtitle {
			color: var(--color-text-light);
			margin-bottom: 30px;
			font-size: 1.1rem;
		}
		
		label {
			font-weight: 600;
			color: var(--color-text);
			display: block;
			margin-bottom: 8px;
			font-size: 0.95rem;
		}
		
		input, textarea, select { 
			width: 100%; 
			padding: 15px; 
			margin: 0 0 20px 0;
			border: 2px solid var(--color-border);
			border-radius: var(--border-radius);
			font-size: 16px;
			font-family: var(--font-primary);
			transition: var(--transition);
			background: var(--color-surface-teal);
		}
		
		input:focus, textarea:focus, select:focus {
			border-color: var(--color-primary);
			outline: none;
			box-shadow: 0 0 0 3px var(--shadow-teal);
			background: var(--color-surface);
			transform: translateY(-1px);
		}
		
		input:hover, textarea:hover, select:hover {
			border-color: var(--color-primary-light);
		}
		
		button { 
			background: var(--gradient-teal-gold);
			color: var(--color-text-inverse); 
			padding: 18px 30px; 
			border: none; 
			border-radius: var(--border-radius);
			cursor: pointer;
			font-size: 18px;
			font-weight: 600;
			width: 100%;
			transition: var(--transition);
			box-shadow: var(--box-shadow);
			text-transform: uppercase;
			letter-spacing: 0.5px;
		}
		
		button:hover {
			transform: translateY(-2px);
			box-shadow: var(--box-shadow-large);
		}
		
		button:active {
			transform: translateY(0);
		}
		
		.required {
			color: var(--color-accent);
			font-weight: bold;
		}
		
		.form-group {
			margin-bottom: 24px;
		}
		
		.response-message {
			margin-top: 30px; 
			padding: 16px;
			font-size: 14px; 
			color: var(--color-text-light); 
			text-align: center;
			background: var(--color-surface-gold);
			border-radius: var(--border-radius);
			border-left: 4px solid var(--color-accent);
		}
		
		/* Mobile optimizations for Windows/Chrome/Firefox priority */
		@media (max-width: 768px) {
			body {
				margin: 20px auto;
				padding: 15px;
			}
			
			.container {
				padding: 30px 20px;
			}
			
			h1 {
				font-size: 1.75rem;
			}
			
			input, textarea, select {
				padding: 12px;
				font-size: 16px; /* Prevents zoom on iOS */
			}
			
			button {
				padding: 16px 24px;
				font-size: 16px;
			}
		}
		
		/* Cross-browser compatibility */
		input[type="email"], input[type="tel"] {
			-webkit-appearance: none;
			-moz-appearance: none;
			appearance: none;
		}
		
		select {
			-webkit-appearance: none;
			-moz-appearance: none;
			appearance: none;
			background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%230f766e' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
			background-repeat: no-repeat;
			background-position: right 12px center;
			background-size: 16px;
			padding-right: 40px;
		}
	</style>
</head>
<body>
	<div class="container">
		<h1>${config.company.emoji} ${config.company.name}</h1>
		<p class="subtitle">${config.company.tagline}</p>
		
		<form method="POST" action="/submit">
			<div class="form-group">
				<label for="name">Name <span class="required">*</span></label>
				<input name="name" id="name" placeholder="Your full name" required>
			</div>
			
			<div class="form-group">
				<label for="email">Email</label>
				<input name="email" id="email" placeholder="your@email.com" type="email">
			</div>
			
			<div class="form-group">
				<label for="phone">Phone</label>
				<input name="phone" id="phone" placeholder="(555) 123-4567" type="tel">
			</div>
			
			<div class="form-group">
				<label for="service_type">Service Type <span class="required">*</span></label>
<select name="service_type" id="service_type" required>
<option value="">Select a service...</option>
${config.contactForm.serviceTypes.map(type => `<option value="${type}">${type}</option>`).join('')}
</select>
</div>

<div class="form-group">
<label for="priority">Urgency</label>
<select name="priority" id="priority">
<option value="">Select urgency...</option>
${config.contactForm.priorityLevels.map(level => `<option value="${level}">${level.charAt(0).toUpperCase() + level.slice(1)}</option>`).join('')}
</select>
</div>
			
			<div class="form-group">
				<label for="message">Message <span class="required">*</span></label>
				<textarea name="message" id="message" placeholder="Describe how we can help you..." rows="5" required></textarea>
			</div>
			
			<button type="submit">${config.contactForm.submitButtonText}</button>
		</form>
		
		<div class="response-message">
			${config.contactForm.responseTimeMessage}
		</div>
	</div>
</body>
</html>`;
}

function getSuccessHTML(config: typeof CONFIG): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Message Sent - ${config.company.name}</title>
	<style>
		${generateThemeCSS(config)}
		
		* { 
			box-sizing: border-box; 
		}
		
		body { 
			font-family: var(--font-primary);
			max-width: 600px; 
			margin: 50px auto; 
			padding: 20px;
			background: var(--gradient-primary);
			min-height: 100vh;
			background-attachment: fixed;
		}
		
		.container {
			background: var(--color-surface);
			padding: 50px 40px;
			border-radius: var(--border-radius-large);
			box-shadow: var(--box-shadow-large);
			border: 1px solid var(--color-border-teal);
			text-align: center;
			position: relative;
			overflow: hidden;
		}
		
		.container::before {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			height: 4px;
			background: var(--gradient-accent);
			border-radius: var(--border-radius-large) var(--border-radius-large) 0 0;
		}
		
		.success-icon { 
			font-size: 80px; 
			margin-bottom: 24px;
			animation: successPulse 2s ease-in-out infinite;
		}
		
		@keyframes successPulse {
			0%, 100% { transform: scale(1); }
			50% { transform: scale(1.1); }
		}
		
		h1 { 
			color: var(--color-success); 
			margin-bottom: 24px;
			font-size: 2.2rem;
			font-weight: 700;
			text-shadow: 0 2px 4px var(--shadow-teal);
		}
		
		p {
			color: var(--color-text);
			font-size: 1.1rem;
			line-height: 1.6;
			margin-bottom: 16px;
		}
		
		.highlight {
			color: var(--color-primary);
			font-weight: 600;
		}
		
		a { 
			display: inline-block;
			background: var(--gradient-teal-gold); 
			color: var(--color-text-inverse); 
			padding: 16px 32px; 
			text-decoration: none;
			border-radius: var(--border-radius);
			margin-top: 30px;
			font-weight: 600;
			font-size: 1.1rem;
			transition: var(--transition);
			box-shadow: var(--box-shadow);
			text-transform: uppercase;
			letter-spacing: 0.5px;
		}
		
		a:hover { 
			transform: translateY(-2px);
			box-shadow: var(--box-shadow-large);
		}
		
		a:active {
			transform: translateY(0);
		}
		
		.celebration {
			background: var(--color-surface-gold);
			padding: 20px;
			border-radius: var(--border-radius);
			margin: 24px 0;
			border-left: 4px solid var(--color-accent);
		}
		
		/* Mobile optimizations */
		@media (max-width: 768px) {
			body {
				margin: 20px auto;
				padding: 15px;
			}
			
			.container {
				padding: 40px 25px;
			}
			
			h1 {
				font-size: 1.8rem;
			}
			
			.success-icon {
				font-size: 64px;
			}
			
			a {
				padding: 14px 24px;
				font-size: 1rem;
			}
		}
	</style>
</head>
<body>
	<div class="container">
		<div class="success-icon">✅</div>
		<h1>Message Sent Successfully!</h1>
		
		<div class="celebration">
			<p>Thank you for contacting <span class="highlight">${config.company.name}</span>. We've received your message and will get back to you within 24 hours.</p>
			<p>We appreciate your business!</p>
		</div>
		
		<a href="/">← Send Another Message</a>
	</div>
</body>
</html>`;
}

function getErrorHTML(error: string, config: typeof CONFIG): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Error - ${config.company.name}</title>
	<style>
		${generateThemeCSS(config)}
		
		* { 
			box-sizing: border-box; 
		}
		
		body { 
			font-family: var(--font-primary);
			max-width: 600px; 
			margin: 50px auto; 
			padding: 20px;
			background: var(--gradient-primary);
			min-height: 100vh;
			background-attachment: fixed;
		}
		
		.container {
			background: var(--color-surface);
			padding: 50px 40px;
			border-radius: var(--border-radius-large);
			box-shadow: var(--box-shadow-large);
			border: 1px solid var(--color-border-teal);
			text-align: center;
			position: relative;
			overflow: hidden;
		}
		
		.container::before {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			height: 4px;
			background: linear-gradient(135deg, var(--color-error) 0%, var(--color-warning) 100%);
			border-radius: var(--border-radius-large) var(--border-radius-large) 0 0;
		}
		
		.error-icon { 
			font-size: 80px; 
			margin-bottom: 24px;
			animation: errorShake 0.5s ease-in-out;
		}
		
		@keyframes errorShake {
			0%, 100% { transform: translateX(0); }
			25% { transform: translateX(-5px); }
			75% { transform: translateX(5px); }
		}
		
		h1 { 
			color: var(--color-error); 
			margin-bottom: 24px;
			font-size: 2.2rem;
			font-weight: 700;
			text-shadow: 0 2px 4px var(--shadow-teal);
		}
		
		.error-message {
			background: var(--color-error-bg);
			padding: 20px;
			border-radius: var(--border-radius);
			margin: 24px 0;
			border-left: 4px solid var(--color-error);
		}
		
		p {
			color: var(--color-text);
			font-size: 1.1rem;
			line-height: 1.6;
			margin-bottom: 16px;
		}
		
		a { 
			display: inline-block;
			background: var(--gradient-teal-gold); 
			color: var(--color-text-inverse); 
			padding: 16px 32px; 
			text-decoration: none;
			border-radius: var(--border-radius);
			margin-top: 30px;
			font-weight: 600;
			font-size: 1.1rem;
			transition: var(--transition);
			box-shadow: var(--box-shadow);
			text-transform: uppercase;
			letter-spacing: 0.5px;
		}
		
		a:hover { 
			transform: translateY(-2px);
			box-shadow: var(--box-shadow-large);
		}
		
		a:active {
			transform: translateY(0);
		}
		
		/* Mobile optimizations */
		@media (max-width: 768px) {
			body {
				margin: 20px auto;
				padding: 15px;
			}
			
			.container {
				padding: 40px 25px;
			}
			
			h1 {
				font-size: 1.8rem;
			}
			
			.error-icon {
				font-size: 64px;
			}
			
			a {
				padding: 14px 24px;
				font-size: 1rem;
			}
		}
	</style>
</head>
<body>
	<div class="container">
		<div class="error-icon">❌</div>
		<h1>Oops! Something went wrong</h1>
		
		<div class="error-message">
			<p>${error}</p>
		</div>
		
		<a href="/">← Try Again</a>
	</div>
</body>
</html>`;
}

function getAdminHTML(submissions: any[], user: CloudflareAccessUser | null = null, config: typeof CONFIG): string {
	const submissionRows = submissions.map(sub => `
		<tr class="submission-row">
			<td class="name-cell">${sub.name}</td>
			<td class="email-cell">${sub.email || '<span class="no-data">N/A</span>'}</td>
			<td class="phone-cell">${sub.phone || '<span class="no-data">N/A</span>'}</td>
			<td class="service-cell"><span class="service-badge">${sub.service_type}</span></td>
			<td class="message-cell" title="${sub.message}">
				<div class="message-preview">${sub.message.substring(0, 50)}${sub.message.length > 50 ? '...' : ''}</div>
			</td>
			<td class="status-cell">
				<form method="POST" action="/admin/update" class="status-form">
					<input type="hidden" name="id" value="${sub.id}">
					<select name="status" class="status-select ${sub.status}" onchange="this.form.submit()">
						${config.admin.statusOptions.map(option =>
							`<option value="${option.value}" ${sub.status === option.value ? 'selected' : ''}>${option.label}</option>`
						).join('')}
					</select>
				</form>
			</td>
			<td class="date-cell">${new Date(sub.created_at).toLocaleDateString()}</td>
		</tr>
	`).join('');

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${config.admin.title} - ${config.company.name}</title>
	<style>
		${generateThemeCSS(config)}
		
		* { 
			box-sizing: border-box; 
		}
		
		body { 
			font-family: var(--font-primary);
			margin: 20px;
			background: var(--gradient-dark);
			min-height: 100vh;
			background-attachment: fixed;
		}
		
		.header {
			background: var(--color-surface);
			padding: 30px;
			border-radius: var(--border-radius-large);
			margin-bottom: 24px;
			box-shadow: var(--box-shadow-large);
			border: 1px solid var(--color-border-teal);
			position: relative;
			overflow: hidden;
		}
		
		.header::before {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			height: 6px;
			background: var(--gradient-teal-gold);
			border-radius: var(--border-radius-large) var(--border-radius-large) 0 0;
		}
		
		.header-top {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 20px;
		}
		
		h1 { 
			color: var(--color-text); 
			margin: 0;
			font-size: 2rem;
			font-weight: 700;
			text-shadow: 0 2px 4px var(--shadow-teal);
		}
		
		.user-info {
			background: var(--gradient-primary);
			color: var(--color-text-inverse);
			padding: 12px 20px;
			border-radius: var(--border-radius);
			font-size: 14px;
			font-weight: 600;
			box-shadow: var(--box-shadow);
		}
		
		.stats {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
			gap: 16px;
			margin-bottom: 20px;
		}
		
		.stat {
			background: var(--gradient-primary);
			color: var(--color-text-inverse);
			padding: 16px 20px;
			border-radius: var(--border-radius);
			font-weight: 600;
			text-align: center;
			box-shadow: var(--box-shadow);
			transition: var(--transition);
		}
		
		.stat:hover {
			transform: translateY(-2px);
			box-shadow: var(--box-shadow-large);
		}
		
		.stat-number {
			font-size: 1.5rem;
			font-weight: 700;
			display: block;
		}
		
		.refresh-btn {
			background: var(--gradient-accent);
			color: var(--color-text-inverse);
			padding: 14px 24px;
			text-decoration: none;
			border-radius: var(--border-radius);
			display: inline-block;
			font-weight: 600;
			transition: var(--transition);
			box-shadow: var(--box-shadow);
			text-transform: uppercase;
			letter-spacing: 0.5px;
		}
		
		.refresh-btn:hover {
			transform: translateY(-2px);
			box-shadow: var(--box-shadow-large);
		}
		
		.table-container {
			background: var(--color-surface);
			border-radius: var(--border-radius-large);
			overflow: hidden;
			box-shadow: var(--box-shadow-large);
			border: 1px solid var(--color-border-teal);
		}
		
		table { 
			width: 100%; 
			border-collapse: collapse; 
		}
		
		th, td { 
			padding: 16px 12px; 
			text-align: left; 
		}
		
		th { 
			background: var(--gradient-dark); 
			color: var(--color-text-inverse);
			font-weight: 600;
			font-size: 0.95rem;
			text-transform: uppercase;
			letter-spacing: 0.5px;
		}
		
		.submission-row {
			border-bottom: 1px solid var(--color-border);
			transition: var(--transition);
		}
		
		.submission-row:nth-child(even) { 
			background: var(--color-surface-teal); 
		}
		
		.submission-row:hover {
			background: var(--color-surface-gold);
			transform: scale(1.01);
		}
		
		.name-cell {
			font-weight: 600;
			color: var(--color-text);
		}
		
		.service-badge {
			background: var(--gradient-primary);
			color: var(--color-text-inverse);
			padding: 4px 12px;
			border-radius: 20px;
			font-size: 0.85rem;
			font-weight: 600;
		}
		
		.message-preview {
			color: var(--color-text-light);
			font-style: italic;
		}
		
		.no-data {
			color: var(--color-text-light);
			font-style: italic;
		}
		
		.status-form {
			display: inline-block;
		}
		
		.status-select {
			padding: 8px 12px;
			border: 2px solid var(--color-border);
			border-radius: var(--border-radius);
			font-weight: 600;
			transition: var(--transition);
			background: var(--color-surface);
		}
		
		.status-select:hover {
			border-color: var(--color-primary);
		}
		
		.status-select.new { 
			background: var(--color-warning-bg);
			border-color: var(--color-warning);
			color: var(--color-warning);
		}
		
		.status-select.in_progress { 
			background: var(--color-surface-teal);
			border-color: var(--color-primary);
			color: var(--color-primary);
		}
		
		.status-select.resolved { 
			background: var(--color-surface);
			border-color: var(--color-success);
			color: var(--color-success);
		}
		
		.status-select.cancelled { 
			background: var(--color-error-bg);
			border-color: var(--color-error);
			color: var(--color-error);
		}
		
		.empty-state {
			text-align: center;
			padding: 60px 40px;
			background: var(--color-surface);
			margin-top: 24px;
			border-radius: var(--border-radius-large);
			box-shadow: var(--box-shadow-large);
			border: 1px solid var(--color-border-teal);
		}
		
		.empty-state h3 {
			color: var(--color-text);
			font-size: 1.5rem;
			margin-bottom: 16px;
		}
		
		.empty-state p {
			color: var(--color-text-light);
			margin-bottom: 24px;
		}
		
		.empty-state a {
			background: var(--gradient-teal-gold);
			color: var(--color-text-inverse);
			padding: 14px 28px;
			text-decoration: none;
			border-radius: var(--border-radius);
			font-weight: 600;
			transition: var(--transition);
			box-shadow: var(--box-shadow);
		}
		
		.empty-state a:hover {
			transform: translateY(-2px);
			box-shadow: var(--box-shadow-large);
		}
		
		/* Mobile optimizations */
		@media (max-width: 1024px) {
			body {
				margin: 15px;
			}
			
			.header {
				padding: 20px;
			}
			
			.header-top {
				flex-direction: column;
				gap: 16px;
				align-items: stretch;
			}
			
			h1 {
				font-size: 1.5rem;
				text-align: center;
			}
			
			.stats {
				grid-template-columns: repeat(2, 1fr);
			}
			
			.table-container {
				overflow-x: auto;
			}
			
			table {
				min-width: 800px;
			}
			
			th, td {
				padding: 12px 8px;
				font-size: 0.9rem;
			}
		}
		
		@media (max-width: 768px) {
			.stats {
				grid-template-columns: 1fr;
			}
			
			th, td {
				padding: 10px 6px;
				font-size: 0.85rem;
			}
		}
		.user-info {
			background: #34495e;
			color: white;
			padding: 8px 15px;
			border-radius: 4px;
			font-size: 14px;
			font-weight: 500;
		}
	</style>
</head>
<body>
	<div class="header">
		<div class="header-top">
			<h1>${config.company.emoji} ${config.company.name} - ${config.admin.title}</h1>
			${user ? `<div class="user-info">👤 ${user.email}</div>` : ''}
		</div>
		
		<div class="stats">
			<div class="stat">
				<span class="stat-number">${submissions.length}</span>
				Total Submissions
			</div>
			<div class="stat">
				<span class="stat-number">${submissions.filter(s => s.status === 'new').length}</span>
				New
			</div>
			<div class="stat">
				<span class="stat-number">${submissions.filter(s => s.status === 'in_progress').length}</span>
				In Progress
			</div>
			<div class="stat">
				<span class="stat-number">${submissions.filter(s => s.status === 'resolved').length}</span>
				Resolved
			</div>
		</div>
		
		<a href="/admin" class="refresh-btn">🔄 Refresh Data</a>
	</div>

	<div class="table-container">
		<table>
			<thead>
				<tr>
					<th>${config.admin.columns.name}</th>
					<th>${config.admin.columns.email}</th>
					<th>${config.admin.columns.phone}</th>
					<th>${config.admin.columns.service}</th>
					<th>${config.admin.columns.message}</th>
					<th>${config.admin.columns.status}</th>
					<th>${config.admin.columns.date}</th>
				</tr>
			</thead>
			<tbody>
				${submissionRows}
			</tbody>
		</table>
	</div>

	${submissions.length === 0 ? `
		<div class="empty-state">
			<h3>${config.admin.emptyState.title}</h3>
			<p>${config.admin.emptyState.message}</p>
			<a href="/">${config.admin.emptyState.buttonText}</a>
		</div>
	` : ''}
</body>
</html>`;
}
