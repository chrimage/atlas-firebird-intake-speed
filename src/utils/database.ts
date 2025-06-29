/**
 * Database Utilities
 */

import type { FormSubmission, Env } from '../types/index.js';

/**
 * Database submission record (includes database-specific fields)
 */
export interface DatabaseSubmission extends FormSubmission {
  status: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Save form submission to database
 * @param env - Environment with D1 database
 * @param submission - Form submission data
 * @returns Promise<void>
 */
export async function saveSubmission(env: Env, submission: FormSubmission): Promise<void> {
  await env.DB.prepare(`
    INSERT INTO submissions (id, name, email, phone, service_type, message, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'new', datetime('now'))
  `).bind(
    submission.id,
    submission.name,
    submission.email,
    submission.phone,
    submission.service_type,
    submission.message
  ).run();
}

/**
 * Get all submissions from database, ordered by creation date
 * @param env - Environment with D1 database
 * @returns Promise<DatabaseSubmission[]>
 */
export async function getAllSubmissions(env: Env): Promise<DatabaseSubmission[]> {
  const { results } = await env.DB.prepare(`
    SELECT * FROM submissions
    ORDER BY created_at DESC
  `).all();

  return results as unknown as DatabaseSubmission[];
}

/**
 * Update submission status
 * @param env - Environment with D1 database
 * @param id - Submission ID
 * @param status - New status value
 * @returns Promise<void>
 */
export async function updateSubmissionStatus(env: Env, id: string, status: string): Promise<void> {
  await env.DB.prepare(`
    UPDATE submissions
    SET status = ?, updated_at = datetime('now')
    WHERE id = ?
  `).bind(status, id).run();
}

/**
 * Get submission by ID
 * @param env - Environment with D1 database
 * @param id - Submission ID
 * @returns Promise<DatabaseSubmission | null>
 */
export async function getSubmissionById(env: Env, id: string): Promise<DatabaseSubmission | null> {
  const result = await env.DB.prepare(`
    SELECT * FROM submissions WHERE id = ?
  `).bind(id).first();

  return result as unknown as DatabaseSubmission | null;
}

/**
 * Get submissions by status
 * @param env - Environment with D1 database
 * @param status - Status to filter by
 * @returns Promise<DatabaseSubmission[]>
 */
export async function getSubmissionsByStatus(env: Env, status: string): Promise<DatabaseSubmission[]> {
  const { results } = await env.DB.prepare(`
    SELECT * FROM submissions
    WHERE status = ?
    ORDER BY created_at DESC
  `).bind(status).all();

  return results as unknown as DatabaseSubmission[];
}

/**
 * Delete submission by ID
 * @param env - Environment with D1 database
 * @param id - Submission ID
 * @returns Promise<void>
 */
export async function deleteSubmission(env: Env, id: string): Promise<void> {
  await env.DB.prepare(`
    DELETE FROM submissions WHERE id = ?
  `).bind(id).run();
}

/**
 * Get submission statistics
 * @param env - Environment with D1 database
 * @returns Promise with counts by status
 */
export async function getSubmissionStats(env: Env): Promise<{
  total: number;
  new: number;
  in_progress: number;
  resolved: number;
  cancelled: number;
}> {
  const results = await env.DB.prepare(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN status = 'new' THEN 1 END) as new,
      COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
      COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
      COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
    FROM submissions
  `).first() as any;

  return {
    total: results.total || 0,
    new: results.new || 0,
    in_progress: results.in_progress || 0,
    resolved: results.resolved || 0,
    cancelled: results.cancelled || 0
  };
}

/**
 * Search submissions by text (name, email, message)
 * @param env - Environment with D1 database
 * @param searchTerm - Text to search for
 * @returns Promise<DatabaseSubmission[]>
 */
export async function searchSubmissions(env: Env, searchTerm: string): Promise<DatabaseSubmission[]> {
  const { results } = await env.DB.prepare(`
    SELECT * FROM submissions
    WHERE
      name LIKE ? OR
      email LIKE ? OR
      message LIKE ? OR
      service_type LIKE ?
    ORDER BY created_at DESC
  `).bind(
    `%${searchTerm}%`,
    `%${searchTerm}%`,
    `%${searchTerm}%`,
    `%${searchTerm}%`
  ).all();

  return results as unknown as DatabaseSubmission[];
}

/**
 * Check if database connection is working
 * @param env - Environment with D1 database
 * @returns Promise<boolean>
 */
export async function healthCheck(env: Env): Promise<boolean> {
  try {
    await env.DB.prepare("SELECT 1").first();
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}