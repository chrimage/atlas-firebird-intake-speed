/**
 * Email Utilities
 */

import { createMimeMessage } from "mimetext";
import type { FormSubmission, Env } from '../types/index.js';
import { getConfig, type CONFIG } from '../config.js';

/**
 * Send admin notification email for form submission
 * @param env - Environment variables
 * @param submission - Form submission data
 */
export async function sendAdminNotification(
  env: Env,
  submission: FormSubmission
): Promise<void> {
  try {
    const config = getConfig(env.ENVIRONMENT);
    const subjectLine = createSubjectLine(submission, config);
    const emailContent = createEmailContent(submission, env, config);
    const domain = env.MG_DOMAIN;
    const apiKey = env.MG_API_KEY;
    
    console.log(`🌍 Sending Atlas Divisions email via domain: ${domain}`);
    const params = new URLSearchParams({
      from: `${config.email.systemName} <${env.FROM_EMAIL}>`,
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
      console.log(`✅ Atlas Divisions email sent: ${response.status} - submission ${submission.id}`);
    }
  } catch (error) {
    console.error('Error sending Atlas Divisions email:', error);
    // Don't throw - we don't want email failure to break form submission
  }
}

/**
 * Create subject line for admin notification
 * @param submission - Form submission data
 * @param config - Application configuration
 * @returns Formatted subject line
 */
export function createSubjectLine(submission: FormSubmission, config: typeof CONFIG): string {
  const serviceType = submission.service_type || 'General';
  const customerName = submission.name || 'Unknown';
  const subject = `${config.email.subjectPrefix}: ${serviceType} - ${customerName}`;
  
  // Truncate to 78 characters for email compatibility
  return subject.length > 78 ? subject.substring(0, 75) + '...' : subject;
}

/**
 * Create email content body for admin notification
 * @param submission - Form submission data
 * @param env - Environment variables
 * @param config - Application configuration
 * @returns Formatted email content
 */
export function createEmailContent(submission: FormSubmission, env: Env, config: typeof CONFIG): string {
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

/**
 * Check if email notifications should be sent
 * @param config - Application configuration
 * @param env - Environment variables
 * @returns boolean indicating if email should be sent
 */
export function shouldSendEmail(config: typeof CONFIG, env: Env): boolean {
  return config.features.enableEmailNotifications && 
         !!env.MG_API_KEY && 
         !!env.MG_DOMAIN &&
         !!env.ADMIN_EMAIL;
}

/**
 * Log email configuration status
 * @param config - Application configuration
 * @param env - Environment variables
 */
export function logEmailStatus(config: typeof CONFIG, env: Env): void {
  if (shouldSendEmail(config, env)) {
    console.log("✅ Email notifications enabled and configured");
  } else {
    console.log("❌ MG_API_KEY, MG_DOMAIN, or ADMIN_EMAIL not configured, or email notifications disabled");
  }
}