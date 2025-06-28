/**
 * Atlas Firebird Intake System - YOLO Edition 🚀
 * Single Worker handling contact form + admin panel
 */

interface Env {
	DB: D1Database;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		
		// Add CORS headers for all responses
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
		};

		// Handle preflight requests
		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		try {
			// Landing page with contact form
			if (url.pathname === '/' && request.method === 'GET') {
				return new Response(getContactFormHTML(), {
					headers: { 'Content-Type': 'text/html', ...corsHeaders }
				});
			}

			// Submit contact form
			if (url.pathname === '/submit' && request.method === 'POST') {
				return handleSubmit(request, env, corsHeaders);
			}

			// Admin panel
			if (url.pathname === '/admin' && request.method === 'GET') {
				return handleAdmin(request, env, corsHeaders);
			}

			// Update submission status
			if (url.pathname === '/admin/update' && request.method === 'POST') {
				return handleStatusUpdate(request, env, corsHeaders);
			}

			return new Response('Not Found', { status: 404, headers: corsHeaders });
		} catch (error) {
			console.error('Worker error:', error);
			return new Response('Internal Server Error', { 
				status: 500, 
				headers: corsHeaders 
			});
		}
	},
} satisfies ExportedHandler<Env>;

async function handleSubmit(request: Request, env: Env, corsHeaders: Record<string, string>) {
	try {
		const formData = await request.formData();
		const id = crypto.randomUUID();
		
		const name = formData.get('name')?.toString();
		const email = formData.get('email')?.toString();
		const phone = formData.get('phone')?.toString();
		const serviceType = formData.get('service_type')?.toString();
		const message = formData.get('message')?.toString();

		// Basic validation
		if (!name || !message || !serviceType) {
			return new Response(getErrorHTML('Name, service type, and message are required'), {
				status: 400,
				headers: { 'Content-Type': 'text/html', ...corsHeaders }
			});
		}

		// Save to database
		await env.DB.prepare(`
			INSERT INTO submissions (id, name, email, phone, service_type, message, status, created_at)
			VALUES (?, ?, ?, ?, ?, ?, 'new', datetime('now'))
		`).bind(id, name, email, phone, serviceType, message).run();

		return new Response(getSuccessHTML(), {
			headers: { 'Content-Type': 'text/html', ...corsHeaders }
		});
	} catch (error) {
		console.error('Submit error:', error);
		return new Response(getErrorHTML('Database error occurred'), {
			status: 500,
			headers: { 'Content-Type': 'text/html', ...corsHeaders }
		});
	}
}

async function handleAdmin(request: Request, env: Env, corsHeaders: Record<string, string>) {
	try {
		const { results } = await env.DB.prepare(`
			SELECT * FROM submissions 
			ORDER BY created_at DESC
		`).all();

		return new Response(getAdminHTML(results), {
			headers: { 'Content-Type': 'text/html', ...corsHeaders }
		});
	} catch (error) {
		console.error('Admin error:', error);
		return new Response('Database error', { 
			status: 500, 
			headers: corsHeaders 
		});
	}
}

async function handleStatusUpdate(request: Request, env: Env, corsHeaders: Record<string, string>) {
	try {
		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		const status = formData.get('status')?.toString();

		if (!id || !status) {
			return new Response('Missing ID or status', { 
				status: 400, 
				headers: corsHeaders 
			});
		}

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

function getContactFormHTML(): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Atlas Firebird - Contact Us</title>
	<style>
		* { box-sizing: border-box; }
		body { 
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			max-width: 600px; 
			margin: 50px auto; 
			padding: 20px;
			background: #f8f9fa;
		}
		.container {
			background: white;
			padding: 40px;
			border-radius: 8px;
			box-shadow: 0 2px 10px rgba(0,0,0,0.1);
		}
		h1 { 
			color: #2c3e50; 
			margin-bottom: 10px;
		}
		.subtitle {
			color: #7f8c8d;
			margin-bottom: 30px;
		}
		input, textarea, select { 
			width: 100%; 
			padding: 12px; 
			margin: 8px 0 16px 0;
			border: 2px solid #e0e0e0;
			border-radius: 4px;
			font-size: 16px;
		}
		input:focus, textarea:focus, select:focus {
			border-color: #3498db;
			outline: none;
		}
		button { 
			background: #3498db; 
			color: white; 
			padding: 15px 30px; 
			border: none; 
			border-radius: 4px;
			cursor: pointer;
			font-size: 16px;
			width: 100%;
		}
		button:hover {
			background: #2980b9;
		}
		.required {
			color: #e74c3c;
		}
		label {
			font-weight: 500;
			color: #2c3e50;
		}
	</style>
</head>
<body>
	<div class="container">
		<h1>🔥 Atlas Firebird</h1>
		<p class="subtitle">Professional Services - Get in touch with us</p>
		
		<form method="POST" action="/submit">
			<label for="name">Name <span class="required">*</span></label>
			<input name="name" id="name" placeholder="Your full name" required>
			
			<label for="email">Email</label>
			<input name="email" id="email" placeholder="your@email.com" type="email">
			
			<label for="phone">Phone</label>
			<input name="phone" id="phone" placeholder="(555) 123-4567" type="tel">
			
			<label for="service_type">Service Type <span class="required">*</span></label>
			<select name="service_type" id="service_type" required>
				<option value="">Select a service...</option>
				<option value="Repair - Plumbing">Repair - Plumbing</option>
				<option value="Repair - Electrical">Repair - Electrical</option>
				<option value="Repair - HVAC">Repair - HVAC</option>
				<option value="Auto Repair">Auto Repair</option>
				<option value="Logistics & Operations">Logistics & Operations</option>
				<option value="AI Tools & Infrastructure">AI Tools & Infrastructure</option>
				<option value="Emergency Response">Emergency Response</option>
				<option value="Other">Other</option>
			</select>
			
			<label for="message">Message <span class="required">*</span></label>
			<textarea name="message" id="message" placeholder="Describe how we can help you..." rows="5" required></textarea>
			
			<button type="submit">Send Message 🚀</button>
		</form>
		
		<p style="margin-top: 30px; font-size: 14px; color: #7f8c8d; text-align: center;">
			We'll get back to you within 24 hours
		</p>
	</div>
</body>
</html>`;
}

function getSuccessHTML(): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Message Sent - Atlas Firebird</title>
	<style>
		* { box-sizing: border-box; }
		body { 
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			max-width: 600px; 
			margin: 50px auto; 
			padding: 20px;
			background: #f8f9fa;
		}
		.container {
			background: white;
			padding: 40px;
			border-radius: 8px;
			box-shadow: 0 2px 10px rgba(0,0,0,0.1);
			text-align: center;
		}
		h1 { color: #27ae60; margin-bottom: 20px; }
		.success-icon { font-size: 64px; margin-bottom: 20px; }
		a { 
			display: inline-block;
			background: #3498db; 
			color: white; 
			padding: 12px 24px; 
			text-decoration: none;
			border-radius: 4px;
			margin-top: 20px;
		}
		a:hover { background: #2980b9; }
	</style>
</head>
<body>
	<div class="container">
		<div class="success-icon">✅</div>
		<h1>Message Sent Successfully!</h1>
		<p>Thank you for contacting Atlas Firebird. We've received your message and will get back to you within 24 hours.</p>
		<p>We appreciate your business!</p>
		<a href="/">← Send Another Message</a>
	</div>
</body>
</html>`;
}

function getErrorHTML(error: string): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Error - Atlas Firebird</title>
	<style>
		* { box-sizing: border-box; }
		body { 
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			max-width: 600px; 
			margin: 50px auto; 
			padding: 20px;
			background: #f8f9fa;
		}
		.container {
			background: white;
			padding: 40px;
			border-radius: 8px;
			box-shadow: 0 2px 10px rgba(0,0,0,0.1);
			text-align: center;
		}
		h1 { color: #e74c3c; margin-bottom: 20px; }
		.error-icon { font-size: 64px; margin-bottom: 20px; }
		a { 
			display: inline-block;
			background: #3498db; 
			color: white; 
			padding: 12px 24px; 
			text-decoration: none;
			border-radius: 4px;
			margin-top: 20px;
		}
		a:hover { background: #2980b9; }
	</style>
</head>
<body>
	<div class="container">
		<div class="error-icon">❌</div>
		<h1>Oops! Something went wrong</h1>
		<p>${error}</p>
		<a href="/">← Try Again</a>
	</div>
</body>
</html>`;
}

function getAdminHTML(submissions: any[]): string {
	const submissionRows = submissions.map(sub => `
		<tr>
			<td>${sub.name}</td>
			<td>${sub.email || 'N/A'}</td>
			<td>${sub.phone || 'N/A'}</td>
			<td>${sub.service_type}</td>
			<td title="${sub.message}">${sub.message.substring(0, 50)}${sub.message.length > 50 ? '...' : ''}</td>
			<td>
				<form method="POST" action="/admin/update" style="display: inline;">
					<input type="hidden" name="id" value="${sub.id}">
					<select name="status" onchange="this.form.submit()">
						<option value="new" ${sub.status === 'new' ? 'selected' : ''}>New</option>
						<option value="in_progress" ${sub.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
						<option value="resolved" ${sub.status === 'resolved' ? 'selected' : ''}>Resolved</option>
						<option value="cancelled" ${sub.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
					</select>
				</form>
			</td>
			<td>${new Date(sub.created_at).toLocaleDateString()}</td>
		</tr>
	`).join('');

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Admin Panel - Atlas Firebird</title>
	<style>
		* { box-sizing: border-box; }
		body { 
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			margin: 20px;
			background: #f8f9fa;
		}
		.header {
			background: white;
			padding: 20px;
			border-radius: 8px;
			margin-bottom: 20px;
			box-shadow: 0 2px 4px rgba(0,0,0,0.1);
		}
		h1 { 
			color: #2c3e50; 
			margin: 0;
		}
		.stats {
			display: flex;
			gap: 20px;
			margin-top: 15px;
		}
		.stat {
			background: #3498db;
			color: white;
			padding: 10px 15px;
			border-radius: 4px;
			font-weight: bold;
		}
		table { 
			width: 100%; 
			border-collapse: collapse; 
			background: white;
			border-radius: 8px;
			overflow: hidden;
			box-shadow: 0 2px 4px rgba(0,0,0,0.1);
		}
		th, td { 
			padding: 12px; 
			text-align: left; 
			border-bottom: 1px solid #e0e0e0;
		}
		th { 
			background: #34495e; 
			color: white;
			font-weight: 600;
		}
		tr:nth-child(even) { 
			background: #f8f9fa; 
		}
		tr:hover {
			background: #e8f4fd;
		}
		select {
			padding: 6px;
			border: 1px solid #ddd;
			border-radius: 3px;
		}
		.new { color: #e67e22; font-weight: bold; }
		.in_progress { color: #3498db; font-weight: bold; }
		.resolved { color: #27ae60; font-weight: bold; }
		.cancelled { color: #e74c3c; font-weight: bold; }
		.refresh-btn {
			background: #27ae60;
			color: white;
			padding: 10px 20px;
			text-decoration: none;
			border-radius: 4px;
			display: inline-block;
			margin-top: 10px;
		}
		.refresh-btn:hover {
			background: #219a52;
		}
	</style>
</head>
<body>
	<div class="header">
		<h1>🔥 Atlas Firebird - Admin Panel</h1>
		<div class="stats">
			<div class="stat">Total: ${submissions.length}</div>
			<div class="stat">New: ${submissions.filter(s => s.status === 'new').length}</div>
			<div class="stat">Active: ${submissions.filter(s => s.status === 'in_progress').length}</div>
			<div class="stat">Resolved: ${submissions.filter(s => s.status === 'resolved').length}</div>
		</div>
		<a href="/admin" class="refresh-btn">🔄 Refresh</a>
	</div>

	<table>
		<thead>
			<tr>
				<th>Name</th>
				<th>Email</th>
				<th>Phone</th>
				<th>Service</th>
				<th>Message</th>
				<th>Status</th>
				<th>Date</th>
			</tr>
		</thead>
		<tbody>
			${submissionRows}
		</tbody>
	</table>

	${submissions.length === 0 ? `
		<div style="text-align: center; padding: 40px; background: white; margin-top: 20px; border-radius: 8px;">
			<h3>No submissions yet</h3>
			<p>Waiting for the first contact form submission...</p>
			<a href="/" style="background: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Test Contact Form</a>
		</div>
	` : ''}
</body>
</html>`;
}
