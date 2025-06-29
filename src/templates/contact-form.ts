/**
 * Contact Form Template
 */

import { generateThemeCSS } from '../styles/theme.js';

export function getContactFormHTML(config: any): string {
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
					${config.contactForm.serviceTypes.map((type: string) => `<option value="${type}">${type}</option>`).join('')}
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