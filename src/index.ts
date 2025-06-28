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


async function sendAdminNotification(
  env: Env,
  submission: FormSubmission
): Promise<void> {
  try {
    const msg = createMimeMessage();
    
    // Configure sender and recipient using config
    const config = getConfig(env.ENVIRONMENT);
    msg.setSender({
      name: config.email.systemName,
      addr: env.FROM_EMAIL
    });
    msg.setRecipient(env.ADMIN_EMAIL);
    
    // Create informative subject line
    const subjectLine = createSubjectLine(submission, config);
    msg.setSubject(subjectLine);
    
    // Create email content
    const emailContent = createEmailContent(submission, env, config);
    msg.addMessage({
      contentType: 'text/plain',
      data: emailContent
    });

    // Send email via Cloudflare
    const message = new EmailMessage(
      env.FROM_EMAIL,
      env.ADMIN_EMAIL,
      msg.asRaw()
    );

    await env.EMAIL_SENDER.send(message);
    console.log(`✅ Email sent for submission ${submission.id}`);
    
  } catch (error) {
    console.error(`❌ Email failed for submission ${submission.id}:`, error);
    // Don't throw - we don't want email failure to break form submission
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
			
			// Atlas Divisions homepage
			if (url.pathname === '/' && request.method === 'GET') {
				response = await getHomepageHTML(corsHeaders);
			}
			// Simple contact form (legacy route)
			else if (url.pathname === '/contact-form' && request.method === 'GET') {
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

async function getHomepageHTML(corsHeaders: Record<string, string>): Promise<Response> {
	// Complete Atlas Divisions homepage with Three.js globe
	const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Atlas Divisions - Solutions That Outlast the Storm</title>
    <meta name="description" content="Atlas Divisions - Mapping Chaos, Building Resilience. Professional services in auto repair, logistics, AI tools, and emergency response.">
    
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    
    <!-- Three.js ES6 Module from CDNjs -->
    <script type="module">
        import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.177.0/three.module.min.js';
        window.THREE = THREE;
        
        // Set up Atlas Globe initialization function with enhanced error handling
        window.initAtlasGlobeWhenReady = function() {
            if (typeof AtlasGlobe !== 'undefined' && typeof THREE !== 'undefined') {
                try {
                    window.atlasGlobe = new AtlasGlobe();
                    console.log('Atlas Globe initialized successfully');
                } catch (error) {
                    console.error('Atlas Globe initialization failed:', error);
                    // Fallback to static globe emoji
                    const container = document.getElementById('globe-container');
                    if (container) {
                        container.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#d4af37;font-size:8rem;animation:float 6s ease-in-out infinite;">🌍</div>';
                    }
                }
            }
        };
        
    </script>
    
    <style>
        :root {
            /* Atlas Divisions Brand Colors */
            --color-bg: #0a0a0a;
            --color-bg-secondary: #1a1a1a;
            --color-text: #ffffff;
            --color-text-secondary: #b8b8b8;
            --color-accent-gold: #d4af37;
            --color-accent-bronze: #cd7f32;
            --color-accent-teal: #008080;
            --emergency-red: #dc143c;
            --ocean-blue: #001122;
            
            /* Typography */
            --font-heading: 'Montserrat', sans-serif;
            --font-body: 'Inter', sans-serif;
            
            /* Effects */
            --border-radius: 8px;
            --border-radius-large: 12px;
            --transition: all 0.3s ease;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: var(--font-body);
            background: var(--color-bg);
            color: var(--color-text);
            line-height: 1.6;
            overflow-x: hidden;
        }
        
        /* Navigation */
        .nav {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1000;
            background: rgba(10, 10, 10, 0.95);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(212, 175, 55, 0.2);
            height: 70px;
        }
        
        .nav-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 2rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: 100%;
        }
        
        .nav-brand {
            font-family: var(--font-heading);
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--color-accent-gold);
            text-decoration: none;
        }
        
        .nav-links {
            display: flex;
            list-style: none;
            gap: 2rem;
        }
        
        .nav-links a {
            color: var(--color-text);
            text-decoration: none;
            font-weight: 500;
            transition: var(--transition);
        }
        
        .nav-links a:hover {
            color: var(--color-accent-gold);
        }
        
        .nav-contact {
            background: var(--color-accent-teal);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: var(--border-radius);
            text-decoration: none;
            font-weight: 600;
            transition: var(--transition);
        }
        
        .nav-contact:hover {
            background: #006666;
            transform: translateY(-2px);
        }
        
        .mobile-menu-toggle {
            display: none;
            background: none;
            border: none;
            color: var(--color-text);
            font-size: 1.5rem;
            cursor: pointer;
        }
        
        /* Hero Section */
        .hero {
            min-height: 100vh;
            display: flex;
            align-items: center;
            padding: 7rem 0 4rem;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
            position: relative;
            overflow: hidden;
        }
        
        .hero::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at 30% 50%, rgba(212, 175, 55, 0.1) 0%, transparent 50%);
            pointer-events: none;
        }
        
        .hero-container {
            max-width: min(95vw, 1200px);
            margin: 0 auto;
            padding: 0 clamp(1rem, 4vw, 2rem);
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: clamp(2rem, 5vw, 4rem);
            align-items: center;
        }
        
        .hero-content {
            animation: fadeInUp 1s ease-out;
        }
        
        .hero-globe {
            display: flex;
            justify-content: center;
            align-items: center;
            animation: fadeInUp 1s ease-out 0.3s both;
        }
        
        .company-title {
            font-family: var(--font-heading);
            font-size: clamp(2.5rem, 5vw, 4rem);
            font-weight: 800;
            color: var(--color-accent-gold);
            margin-bottom: 1rem;
            text-shadow: 0 4px 8px rgba(212, 175, 55, 0.3);
        }
        
        .company-tagline {
            font-size: clamp(1.2rem, 2.5vw, 1.5rem);
            color: var(--color-text-secondary);
            margin-bottom: 1rem;
            font-weight: 500;
        }
        
        .company-message {
            font-size: clamp(1.1rem, 2vw, 1.3rem);
            color: var(--color-accent-teal);
            margin-bottom: 2rem;
            font-weight: 600;
        }
        
        .identity-card {
            background: rgba(26, 26, 26, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(212, 175, 55, 0.2);
            border-radius: var(--border-radius-large);
            padding: 2rem;
            margin: 2rem 0;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }
        
        .identity-text {
            font-size: 1.1rem;
            line-height: 1.8;
            color: var(--color-text);
        }
        
        .cta-buttons {
            display: flex;
            gap: 1rem;
            margin-top: 2rem;
            flex-wrap: wrap;
        }
        
        .btn {
            padding: 1rem 2rem;
            border: none;
            border-radius: var(--border-radius);
            font-weight: 600;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            transition: var(--transition);
            cursor: pointer;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, var(--color-accent-teal) 0%, var(--color-accent-gold) 100%);
            color: white;
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(212, 175, 55, 0.3);
        }
        
        .btn-secondary {
            background: transparent;
            color: var(--color-accent-gold);
            border: 2px solid var(--color-accent-gold);
        }
        
        .btn-secondary:hover {
            background: var(--color-accent-gold);
            color: var(--color-bg);
            transform: translateY(-2px);
        }
        
        .email-copy {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--color-accent-gold);
            cursor: pointer;
            transition: var(--transition);
        }
        
        .email-copy:hover {
            color: var(--color-accent-bronze);
        }
        
        /* Globe Container */
        #globe-container {
            width: min(40vw, 500px);
            height: min(40vw, 500px);
            position: relative;
            margin: 0 auto;
            filter: drop-shadow(0 0 30px rgba(212, 175, 55, 0.3));
            animation: float 6s ease-in-out infinite;
        }
        
        #globe-container:hover {
            transform: scale(1.05);
        }
        
        /* Services Section */
        .services {
            padding: 6rem 0;
            background: var(--color-bg-secondary);
        }
        
        .services-container {
            max-width: min(95vw, 1200px);
            margin: 0 auto;
            padding: 0 clamp(1rem, 4vw, 2rem);
        }
        
        .section-title {
            font-family: var(--font-heading);
            font-size: clamp(2rem, 4vw, 3rem);
            text-align: center;
            margin-bottom: 3rem;
            color: var(--color-text);
        }
        
        .services-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            grid-template-rows: repeat(2, 1fr);
            gap: clamp(1rem, 3vw, 2rem);
            max-width: min(90vw, 800px);
            margin: 0 auto;
        }
        
        .service-card {
            background: rgba(26, 26, 26, 0.95);
            border: 1px solid rgba(212, 175, 55, 0.2);
            border-radius: var(--border-radius-large);
            padding: 2rem;
            transition: var(--transition);
            position: relative;
            overflow: hidden;
        }
        
        .service-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(135deg, var(--color-accent-teal) 0%, var(--color-accent-gold) 100%);
        }
        
        .service-card.emergency::before {
            background: var(--emergency-red);
        }
        
        .service-card:hover {
            transform: translateY(-8px);
            border-color: rgba(212, 175, 55, 0.4);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }
        
        .service-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
            display: block;
        }
        
        .service-title {
            font-family: var(--font-heading);
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 1rem;
            color: var(--color-text);
        }
        
        .service-focus {
            color: var(--color-accent-gold);
            font-weight: 600;
            margin-bottom: 1rem;
        }
        
        .service-features {
            list-style: none;
            margin-bottom: 1.5rem;
        }
        
        .service-features li {
            padding: 0.25rem 0;
            color: var(--color-text-secondary);
            position: relative;
            padding-left: 1.5rem;
        }
        
        .service-features li::before {
            content: '✓';
            position: absolute;
            left: 0;
            color: var(--color-accent-teal);
            font-weight: bold;
        }
        
        .emergency .service-features li::before {
            color: var(--emergency-red);
        }
        
        /* Contact Section */
        .contact {
            padding: 6rem 0;
            background: var(--color-bg);
        }
        
        .contact-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 2rem;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4rem;
        }
        
        .contact-info h2 {
            font-family: var(--font-heading);
            font-size: 2.5rem;
            margin-bottom: 2rem;
            color: var(--color-text);
        }
        
        .contact-methods {
            margin-bottom: 2rem;
        }
        
        .contact-method {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1rem;
            padding: 1rem;
            background: rgba(26, 26, 26, 0.5);
            border-radius: var(--border-radius);
            transition: var(--transition);
        }
        
        .contact-method:hover {
            background: rgba(26, 26, 26, 0.8);
        }
        
        .contact-form {
            background: rgba(26, 26, 26, 0.95);
            padding: 2rem;
            border-radius: var(--border-radius-large);
            border: 1px solid rgba(212, 175, 55, 0.2);
        }
        
        .form-group {
            margin-bottom: 1.5rem;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            color: var(--color-text);
            font-weight: 600;
        }
        
        .form-group input,
        .form-group select,
        .form-group textarea {
            width: 100%;
            padding: 1rem;
            border: 2px solid rgba(212, 175, 55, 0.2);
            border-radius: var(--border-radius);
            background: rgba(10, 10, 10, 0.5);
            color: var(--color-text);
            font-family: var(--font-body);
            transition: var(--transition);
        }
        
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
            outline: none;
            border-color: var(--color-accent-gold);
            box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
        }
        
        .required {
            color: var(--emergency-red);
        }
        
        /* Animations */
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes float {
            0%, 100% {
                transform: translateY(0px);
            }
            50% {
                transform: translateY(-20px);
            }
        }
        
        /* Responsive Design */
        @media (max-width: 1024px) {
            .nav-links {
                display: none;
            }
            
            .mobile-menu-toggle {
                display: block;
            }
            
            /* MOBILE HERO: Simple single column layout */
            .hero-container {
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                text-align: center !important;
                gap: 2rem !important;
                max-width: 95vw !important;
            }
            
            /* Company TITLE comes first */
            .company-title {
                order: 1 !important;
                margin-bottom: 1rem !important;
            }
            
            /* Globe comes SECOND and is HUGE */
            .hero-globe {
                order: 2 !important;
                width: 100% !important;
                display: flex !important;
                justify-content: center !important;
                margin: 2rem 0 !important;
            }
            
            /* Rest of content comes THIRD */
            .hero-content {
                order: 3 !important;
                width: 100% !important;
            }
            
            .company-tagline,
            .company-message,
            .identity-card,
            .cta-buttons {
                order: inherit !important;
            }
            
            /* Make globe MASSIVE on mobile */
            #globe-container {
                width: 85vw !important;
                height: 85vw !important;
                max-width: 450px !important;
                max-height: 450px !important;
                min-width: 300px !important;
                min-height: 300px !important;
            }
            
            .contact-container {
                grid-template-columns: 1fr;
            }
            
            .cta-buttons {
                justify-content: center;
            }
            
            .services-grid {
                grid-template-columns: 1fr;
                grid-template-rows: repeat(4, 1fr);
                max-width: min(95vw, 400px);
                gap: clamp(1rem, 4vw, 1.5rem);
            }
        }
        
        @media (max-width: 480px) {
            .nav-container {
                padding: 0 1rem;
            }
            
            .hero {
                padding: 5rem 0 2rem;
            }
            
            .hero-container,
            .services-container,
            .contact-container {
                padding: 0 1rem;
            }
            
            #globe-container {
                width: 200px;
                height: 200px;
            }
        }
    </style>
</head>
<body>
    <!-- Navigation -->
    <nav class="nav">
        <div class="nav-container">
            <a href="#home" class="nav-brand">🌍 Atlas Divisions</a>
            <ul class="nav-links">
                <li><a href="#home">Home</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#services">Services</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
            <a href="#contact" class="nav-contact">Get in Touch</a>
            <button class="mobile-menu-toggle">☰</button>
        </div>
    </nav>

    <!-- Hero Section -->
    <section id="home" class="hero">
        <div class="hero-container">
            <div class="hero-globe">
                <div id="globe-container"></div>
            </div>
            
            <div class="hero-content">
                <h1 class="company-title">Atlas Divisions</h1>
                <p class="company-tagline">Solutions That Outlast the Storm</p>
                <p class="company-message">Mapping Chaos. Building Resilience.</p>
                
                <div class="identity-card">
                    <p class="identity-text">
                        Founded by <strong>Captain Harley Miller</strong>, Atlas Divisions delivers no-nonsense, 
                        transparent solutions across multiple domains. We specialize in adaptive response, 
                        crisis management, and building systems that endure. Our military-influenced precision 
                        meets practical problem-solving to create solutions that truly outlast the storm.
                    </p>
                </div>
                
                <div class="cta-buttons">
                    <a href="#services" class="btn btn-primary">
                        Explore Services
                    </a>
                    <a href="#contact" class="btn btn-secondary">
                        Start Project
                    </a>
                </div>
                
                <div class="cta-buttons">
                    <span class="email-copy" onclick="copyEmail()">
                        📧 harley@atlasdivisions.com
                        <span id="copy-feedback" style="display: none; color: var(--color-accent-teal);">✓ Copied!</span>
                    </span>
                </div>
            </div>
        </div>
    </section>

    <!-- Services Section -->
    <section id="services" class="services">
        <div class="services-container">
            <h2 class="section-title">Our Services</h2>
            <div class="services-grid">
                <div class="service-card">
                    <span class="service-icon">🔧</span>
                    <h3 class="service-title">Auto & Home Systems Repair</h3>
                    <p class="service-focus">Practical, reliable repairs</p>
                    <ul class="service-features">
                        <li>Transparent pricing</li>
                        <li>Emergency availability</li>
                        <li>Maintenance planning</li>
                        <li>No-nonsense diagnostics</li>
                    </ul>
                </div>
                
                <div class="service-card">
                    <span class="service-icon">📊</span>
                    <h3 class="service-title">Logistics & Adaptive Operations</h3>
                    <p class="service-focus">Streamlined operations for businesses</p>
                    <ul class="service-features">
                        <li>Tailored solutions</li>
                        <li>Crisis response</li>
                        <li>Efficiency audits</li>
                        <li>Scalable design</li>
                    </ul>
                </div>
                
                <div class="service-card">
                    <span class="service-icon">🤖</span>
                    <h3 class="service-title">AI Tools & Digital Infrastructure</h3>
                    <p class="service-focus">Transparent AI integration</p>
                    <ul class="service-features">
                        <li>Ethical implementation</li>
                        <li>Custom automation</li>
                        <li>Infrastructure setup</li>
                        <li>Training & documentation</li>
                    </ul>
                </div>
                
                <div class="service-card emergency">
                    <span class="service-icon">🚨</span>
                    <h3 class="service-title">Emergency & Crisis Response</h3>
                    <p class="service-focus">24/7 urgent situation response</p>
                    <ul class="service-features">
                        <li>Emergency availability</li>
                        <li>Rapid assessment</li>
                        <li>Multi-domain management</li>
                        <li>Clear communication</li>
                    </ul>
                </div>
            </div>
        </div>
    </section>

    <!-- Contact Section -->
    <section id="contact" class="contact">
        <div class="contact-container">
            <div class="contact-info">
                <h2>Get in Touch</h2>
                <div class="contact-methods">
                    <div class="contact-method">
                        <span>📧</span>
                        <div>
                            <strong>Email:</strong><br>
                            <span class="email-copy" onclick="copyEmail()">harley@atlasdivisions.com</span>
                        </div>
                    </div>
                    <div class="contact-method">
                        <span>⚡</span>
                        <div>
                            <strong>Response Time:</strong><br>
                            Within 24 hours
                        </div>
                    </div>
                    <div class="contact-method">
                        <span>🌐</span>
                        <div>
                            <strong>Domain:</strong><br>
                            atlasdivisions.com
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="contact-form">
                <h3>Send a Message</h3>
                <form action="/submit" method="POST">
                    <div class="form-group">
                        <label for="name">Name <span class="required">*</span></label>
                        <input type="text" id="name" name="name" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" name="email">
                    </div>
                    
                    <div class="form-group">
                        <label for="phone">Phone</label>
                        <input type="tel" id="phone" name="phone">
                    </div>
                    
                    <div class="form-group">
                        <label for="service_type">Service Type <span class="required">*</span></label>
                        <select id="service_type" name="service_type" required>
                            <option value="">Select a service...</option>
                            <option value="Auto & Home Systems Repair">Auto & Home Systems Repair</option>
                            <option value="Logistics & Adaptive Operations">Logistics & Adaptive Operations</option>
                            <option value="AI Tools & Digital Infrastructure">AI Tools & Digital Infrastructure</option>
                            <option value="Emergency & Crisis Response">Emergency & Crisis Response</option>
                            <option value="General Inquiry">General Inquiry</option>
                            <option value="Partnership Opportunity">Partnership Opportunity</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="message">Message <span class="required">*</span></label>
                        <textarea id="message" name="message" rows="5" placeholder="Describe how we can help you..." required></textarea>
                    </div>
                    
                    <button type="submit" class="btn btn-primary" style="width: 100%;">
                        Send Message 🚀
                    </button>
                </form>
            </div>
        </div>
    </section>

    <script>
        // Atlas Divisions Globe Class - Enhanced Animation Implementation
        class AtlasGlobe {
            constructor() {
                this.scene = null;
                this.camera = null;
                this.renderer = null;
                this.globeMesh = null;
                
                this.isDragging = false;
                this.previousMousePosition = { x: 0, y: 0 };
                this.rotationVelocity = { x: 0, y: 0 };
                this.autoRotationSpeed = 0.005; // Fixed consistent rate for west-to-east rotation
                this.friction = 0.95; // Slightly more friction for smoother transitions
                this.rotationSpeed = 0.008; // Adjusted for left-right only interaction
                
                // Atlas Divisions styling
                this.atlasColors = {
                    ocean: '#001122',
                    land: '#d4af37',   // Atlas gold
                    stroke: '#cd7f32', // Atlas bronze
                    atmosphere: 0xd4af37, // Gold atmosphere
                    light: 0xd4af37    // Gold lighting
                };
                
                this.init();
            }
            
            init() {
                if (typeof THREE === 'undefined') {
                    console.error('Three.js not loaded');
                    const container = document.getElementById('globe-container');
                    if (container) {
                        container.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#d4af37;font-size:4rem;">🌍</div>';
                    }
                    return;
                }
                
                this.createScene();
                this.setupEventListeners();
            }
            
            createScene() {
                const container = document.getElementById('globe-container');
                if (!container) return;
                
                // Force container to update its computed styles
                container.style.display = container.style.display;
                
                // Wait a moment for CSS to apply, then get dimensions
                setTimeout(() => {
                    const width = container.offsetWidth || container.clientWidth;
                    const height = container.offsetHeight || container.clientHeight;
                    
                    console.log('Globe container dimensions:', width, 'x', height);
                    
                    this.scene = new THREE.Scene();
                    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
                    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
                    
                    this.renderer.setSize(width, height);
                    this.renderer.setClearColor(0x000000, 0);
                    container.appendChild(this.renderer.domElement);
                    
                    this.camera.position.z = 4;
                    
                    // Create globe after scene is ready
                    this.createGlobe();
                    this.setupLighting();
                    this.animate();
                }, 100);
            }
            
            async createGlobe() {
                const geometry = new THREE.SphereGeometry(1.5, 64, 64);
                const texture = await this.createAtlasTexture();
                
                const material = new THREE.MeshPhongMaterial({
                    map: texture,
                    transparent: true,
                    opacity: 0.9
                });
                
                this.globeMesh = new THREE.Mesh(geometry, material);
                this.globeMesh.rotation.x = 0.1;
                this.scene.add(this.globeMesh);
                
                this.createAtmosphere();
                
                // Start with consistent west-to-east auto-rotation (Y-axis only)
                this.rotationVelocity.x = 0; // No vertical rotation
                this.rotationVelocity.y = this.autoRotationSpeed;
            }
            
            createAtmosphere() {
                const atmosphereGeometry = new THREE.SphereGeometry(1.6, 64, 64);
                const atmosphereMaterial = new THREE.MeshBasicMaterial({
                    color: this.atlasColors.atmosphere,
                    transparent: true,
                    opacity: 0.1,
                    side: THREE.BackSide
                });
                const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
                this.scene.add(atmosphere);
            }
            
            setupLighting() {
                const ambientLight = new THREE.AmbientLight(this.atlasColors.light, 0.4);
                this.scene.add(ambientLight);
                
                const directionalLight = new THREE.DirectionalLight(this.atlasColors.light, 0.8);
                directionalLight.position.set(5, 3, 5);
                this.scene.add(directionalLight);
            }
            
            async createAtlasTexture() {
                const canvas = document.createElement('canvas');
                canvas.width = 2048;
                canvas.height = 1024;
                const ctx = canvas.getContext('2d');
                
                // Ocean background
                ctx.fillStyle = this.atlasColors.ocean;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                try {
                    const response = await fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson');
                    const geoData = await response.json();
                    this.drawWorldMap(ctx, geoData, canvas.width, canvas.height);
                } catch (error) {
                    console.log('Using fallback map');
                    this.drawFallbackMap(ctx, canvas.width, canvas.height);
                }
                
                const texture = new THREE.CanvasTexture(canvas);
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.ClampToEdgeWrapping;
                return texture;
            }
            
            drawWorldMap(ctx, geoData, width, height) {
                ctx.fillStyle = this.atlasColors.land;
                ctx.strokeStyle = this.atlasColors.stroke;
                ctx.lineWidth = 1;
                
                geoData.features.forEach(feature => {
                    if (feature.geometry.type === 'Polygon') {
                        this.drawPolygon(ctx, feature.geometry.coordinates, width, height);
                    } else if (feature.geometry.type === 'MultiPolygon') {
                        feature.geometry.coordinates.forEach(polygon => {
                            this.drawPolygon(ctx, polygon, width, height);
                        });
                    }
                });
            }
            
            drawPolygon(ctx, coordinates, width, height) {
                coordinates.forEach(ring => {
                    ctx.beginPath();
                    ring.forEach((coord, index) => {
                        const x = ((coord[0] + 180) / 360) * width;
                        const y = ((90 - coord[1]) / 180) * height;
                        
                        if (index === 0) {
                            ctx.moveTo(x, y);
                        } else {
                            ctx.lineTo(x, y);
                        }
                    });
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                });
            }
            
            drawFallbackMap(ctx, width, height) {
                const continents = [
                    { x: 0.2, y: 0.3, w: 0.25, h: 0.4 },
                    { x: 0.25, y: 0.5, w: 0.15, h: 0.35 },
                    { x: 0.48, y: 0.25, w: 0.12, h: 0.15 },
                    { x: 0.5, y: 0.35, w: 0.15, h: 0.4 },
                    { x: 0.6, y: 0.2, w: 0.3, h: 0.35 },
                    { x: 0.75, y: 0.65, w: 0.12, h: 0.1 }
                ];
                
                ctx.fillStyle = this.atlasColors.land;
                continents.forEach(continent => {
                    ctx.fillRect(
                        continent.x * width,
                        continent.y * height,
                        continent.w * width,
                        continent.h * height
                    );
                });
            }
            
            setupEventListeners() {
                const container = document.getElementById('globe-container');
                if (!container) return;
                
                container.style.cursor = 'grab';
                
                container.addEventListener('mousedown', this.onMouseDown.bind(this));
                container.addEventListener('mousemove', this.onMouseMove.bind(this));
                container.addEventListener('mouseup', this.onMouseUp.bind(this));
                container.addEventListener('mouseleave', this.onMouseLeave.bind(this));
                
                container.addEventListener('touchstart', this.onTouchStart.bind(this));
                container.addEventListener('touchmove', this.onTouchMove.bind(this));
                container.addEventListener('touchend', this.onTouchEnd.bind(this));
                
                window.addEventListener('resize', this.onWindowResize.bind(this));
                
                // Add ResizeObserver to watch container size changes
                if (window.ResizeObserver) {
                    const resizeObserver = new ResizeObserver((entries) => {
                        for (const entry of entries) {
                            if (entry.target.id === 'globe-container') {
                                this.onWindowResize();
                            }
                        }
                    });
                    resizeObserver.observe(container);
                }
            }
            
            onMouseDown(event) {
                this.startDragging(event.clientX, event.clientY);
                document.getElementById('globe-container').style.cursor = 'grabbing';
            }
            
            onMouseMove(event) {
                if (this.isDragging) {
                    this.updateRotation(event.clientX, event.clientY);
                }
            }
            
            onMouseUp() {
                this.stopDragging();
                document.getElementById('globe-container').style.cursor = 'grab';
            }
            
            onMouseLeave() {
                this.stopDragging();
                document.getElementById('globe-container').style.cursor = 'grab';
            }
            
            onTouchStart(event) {
                event.preventDefault();
                if (event.touches.length === 1) {
                    const touch = event.touches[0];
                    this.startDragging(touch.clientX, touch.clientY);
                }
            }
            
            onTouchMove(event) {
                event.preventDefault();
                if (this.isDragging && event.touches.length === 1) {
                    const touch = event.touches[0];
                    this.updateRotation(touch.clientX, touch.clientY);
                }
            }
            
            onTouchEnd(event) {
                event.preventDefault();
                this.stopDragging();
            }
            
            startDragging(clientX, clientY) {
                this.isDragging = true;
                const container = document.getElementById('globe-container');
                const rect = container.getBoundingClientRect();
                this.previousMousePosition = {
                    x: clientX - rect.left,
                    y: clientY - rect.top
                };
            }
            
            updateRotation(clientX, clientY) {
                const container = document.getElementById('globe-container');
                const rect = container.getBoundingClientRect();
                const currentMousePosition = {
                    x: clientX - rect.left,
                    y: clientY - rect.top
                };
                
                const deltaX = currentMousePosition.x - this.previousMousePosition.x;
                // const deltaY = currentMousePosition.y - this.previousMousePosition.y; // Ignore Y movement
                
                // Only allow left-right (horizontal) rotation - Y-axis rotation only
                this.rotationVelocity.x = 0; // Disable vertical rotation completely
                this.rotationVelocity.y = deltaX * this.rotationSpeed; // Only horizontal rotation
                
                this.previousMousePosition = currentMousePosition;
            }
            
            stopDragging() {
                this.isDragging = false;
            }
            
            onWindowResize() {
                const container = document.getElementById('globe-container');
                if (!container || !this.renderer || !this.camera) return;
                
                const width = container.offsetWidth || container.clientWidth;
                const height = container.offsetHeight || container.clientHeight;
                
                console.log('Resizing globe canvas to:', width, 'x', height);
                
                this.camera.aspect = width / height;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(width, height);
            }
            
            animate() {
                requestAnimationFrame(this.animate.bind(this));
                
                if (this.globeMesh) {
                    if (this.isDragging) {
                        // When dragging, only apply Y-axis rotation from user interaction
                        this.globeMesh.rotation.y += this.rotationVelocity.y;
                        // Keep X rotation fixed (no up-down rotation)
                    } else {
                        // When not dragging, apply friction to user velocity
                        this.rotationVelocity.y *= this.friction;
                        
                        // Apply user velocity if still significant
                        if (Math.abs(this.rotationVelocity.y) > 0.001) {
                            this.globeMesh.rotation.y += this.rotationVelocity.y;
                        } else {
                            // Return to consistent fixed auto-rotation (west to east)
                            this.rotationVelocity.y = 0;
                            this.globeMesh.rotation.y += this.autoRotationSpeed;
                        }
                    }
                    
                    // Keep X rotation fixed - no vertical rotation allowed
                    this.globeMesh.rotation.x = 0.1; // Slight tilt for better viewing angle
                }
                
                this.renderer.render(this.scene, this.camera);
            }
        }
        
        // Initialize globe
        let atlasGlobe = null;
        
        // Copy email functionality
        function copyEmail() {
            const email = 'harley@atlasdivisions.com';
            
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(email).then(() => {
                    showCopyFeedback();
                }).catch(() => {
                    fallbackCopyMethod(email);
                });
            } else {
                fallbackCopyMethod(email);
            }
        }
        
        function fallbackCopyMethod(email) {
            const textArea = document.createElement('textarea');
            textArea.value = email;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            
            try {
                document.execCommand('copy');
                showCopyFeedback();
            } catch (err) {
                console.error('Failed to copy email:', err);
            }
            
            document.body.removeChild(textArea);
        }
        
        function showCopyFeedback() {
            const feedback = document.getElementById('copy-feedback');
            if (feedback) {
                feedback.style.display = 'inline';
                setTimeout(() => {
                    feedback.style.display = 'none';
                }, 2000);
            }
        }
        
        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
        
        // Initialize Atlas Globe when page loads with progressive enhancement
        window.addEventListener('load', function() {
            // Initialize the Atlas Globe with retry logic (no loading message that breaks formatting)
            function initializeGlobe(retries = 3) {
                if (typeof window.initAtlasGlobeWhenReady === 'function') {
                    window.initAtlasGlobeWhenReady();
                } else if (retries > 0) {
                    setTimeout(() => initializeGlobe(retries - 1), 200);
                } else {
                    // Final fallback after all retries - just show static globe emoji
                    const container = document.getElementById('globe-container');
                    if (container) {
                        container.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#d4af37;font-size:8rem;animation:float 6s ease-in-out infinite;">🌍</div>';
                    }
                }
            }
            
            initializeGlobe();
        });
        
        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            if (atlasGlobe && atlasGlobe.renderer) {
                // Clean up Three.js resources
                const container = document.getElementById('globe-container');
                if (container && atlasGlobe.renderer.domElement) {
                    container.removeChild(atlasGlobe.renderer.domElement);
                }
                atlasGlobe.renderer.dispose();
            }
        });
    </script>
</body>
</html>`;

	return new Response(html, {
		headers: { 'Content-Type': 'text/html', ...corsHeaders }
	});
}

async function handleSubmit(request: Request, env: Env, corsHeaders: Record<string, string>, config: typeof CONFIG) {
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
			return new Response(getErrorHTML('Name, service type, and message are required', config), {
				status: 400,
				headers: { 'Content-Type': 'text/html', ...corsHeaders }
			});
		}

		// Save to database
		const timestamp = new Date().toISOString();
		await env.DB.prepare(`
			INSERT INTO submissions (id, name, email, phone, service_type, message, status, created_at)
			VALUES (?, ?, ?, ?, ?, ?, 'new', datetime('now'))
		`).bind(id, name, email, phone, serviceType, message).run();

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
