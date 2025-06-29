/**
 * Error Page Template
 */

import { generateThemeCSS } from '../styles/theme.js';

export function getErrorHTML(error: string, config: any): string {
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