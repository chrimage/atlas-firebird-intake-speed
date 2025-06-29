/**
 * Admin Panel Template
 */

import { generateThemeCSS } from '../styles/theme.js';
import type { CloudflareAccessUser } from '../types/index.js';

export function getAdminHTML(submissions: any[], user: CloudflareAccessUser | null = null, config: any): string {
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
						${config.admin.statusOptions.map((option: any) =>
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