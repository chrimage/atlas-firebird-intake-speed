/**
 * Success Page Template
 */

import { generateThemeCSS } from '../styles/theme.js';

export function getSuccessHTML(config: any): string {
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