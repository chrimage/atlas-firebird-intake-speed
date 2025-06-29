/**
 * Email Utilities
 */

import { EmailMessage } from "cloudflare:email";
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
         !!env.EMAIL_SENDER && 
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
    console.log("❌ EMAIL_SENDER or ADMIN_EMAIL not configured, or email notifications disabled");
  }
}