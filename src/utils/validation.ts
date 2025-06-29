/**
 * Validation Utilities
 */

import type { FormSubmission } from '../types/index.js';
import type { CONFIG } from '../config.js';

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Form data interface for validation
 */
export interface FormData {
  name?: string;
  email?: string;
  phone?: string;
  service_type?: string;
  message?: string;
}

/**
 * Validate form submission data
 * @param formData - Raw form data
 * @param config - Application configuration
 * @returns ValidationResult with success status and error messages
 */
export function validateFormSubmission(formData: FormData, config: typeof CONFIG): ValidationResult {
  const errors: string[] = [];

  // Required field validation
  if (!formData.name || formData.name.trim().length === 0) {
    errors.push(config.contactForm.validation.nameRequired);
  }

  if (!formData.service_type || formData.service_type.trim().length === 0) {
    errors.push(config.contactForm.validation.serviceTypeRequired);
  }

  if (!formData.message || formData.message.trim().length === 0) {
    errors.push(config.contactForm.validation.messageRequired);
  }

  // Email validation (if provided)
  if (formData.email && formData.email.trim().length > 0) {
    if (!isValidEmail(formData.email)) {
      errors.push(config.contactForm.validation.emailInvalid);
    }
  }

  // Service type validation
  if (formData.service_type && !isValidServiceType(formData.service_type, config)) {
    errors.push("Invalid service type selected");
  }

  // Input length validation
  if (formData.name && formData.name.length > 255) {
    errors.push("Name must be less than 255 characters");
  }

  if (formData.email && formData.email.length > 255) {
    errors.push("Email must be less than 255 characters");
  }

  if (formData.phone && formData.phone.length > 50) {
    errors.push("Phone number must be less than 50 characters");
  }

  if (formData.message && formData.message.length > 10000) {
    errors.push("Message must be less than 10,000 characters");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate email format using regex
 * @param email - Email address to validate
 * @returns boolean indicating if email is valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate service type against configuration
 * @param serviceType - Service type to validate
 * @param config - Application configuration
 * @returns boolean indicating if service type is valid
 */
export function isValidServiceType(serviceType: string, config: typeof CONFIG): boolean {
  return config.contactForm.serviceTypes.includes(serviceType);
}

/**
 * Validate status value for admin updates
 * @param status - Status value to validate
 * @param config - Application configuration
 * @returns boolean indicating if status is valid
 */
export function isValidStatus(status: string, config: typeof CONFIG): boolean {
  const validStatuses = config.admin.statusOptions.map(option => option.value);
  return validStatuses.includes(status);
}

/**
 * Sanitize form input by trimming whitespace and removing potentially harmful content
 * @param input - Raw input string
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
    .substring(0, 10000); // Limit length
}

/**
 * Create a form submission object from validated form data
 * @param formData - Validated form data
 * @returns FormSubmission object
 */
export function createFormSubmission(formData: FormData): Omit<FormSubmission, 'id' | 'timestamp'> {
  return {
    name: sanitizeInput(formData.name!),
    email: formData.email ? sanitizeInput(formData.email) : undefined,
    phone: formData.phone ? sanitizeInput(formData.phone) : undefined,
    service_type: sanitizeInput(formData.service_type!),
    message: sanitizeInput(formData.message!)
  };
}

/**
 * Convert FormData object to our internal format
 * @param formData - Browser FormData object
 * @returns FormData object for validation
 */
export function parseFormData(formData: globalThis.FormData): FormData {
  return {
    name: formData.get('name')?.toString(),
    email: formData.get('email')?.toString(),
    phone: formData.get('phone')?.toString(),
    service_type: formData.get('service_type')?.toString(),
    message: formData.get('message')?.toString()
  };
}

/**
 * Generate validation error HTML response
 * @param errors - Array of error messages
 * @returns HTML string for error display
 */
export function formatValidationErrors(errors: string[]): string {
  return `
    <div class="validation-errors">
      <h3>Please correct the following errors:</h3>
      <ul>
        ${errors.map(error => `<li>${error}</li>`).join('')}
      </ul>
    </div>
  `;
}