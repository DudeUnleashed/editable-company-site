// ==========================================
// SANITIZER UTILITY
// ==========================================

// Provides client-side input sanitization using DOMPurify
// Prevents XSS attacks by sanitizing user input before submission
// and when rendering user-generated content

import DOMPurify from 'dompurify';

/**
 * Sanitize plain text - removes all HTML tags and scripts
 * Use this for text inputs like names, emails, phone numbers
 * @param text - The text to sanitize
 * @returns Sanitized text with all HTML removed
 */
export const sanitizeText = (text: string): string => {
  if (!text) return '';

  // Remove all HTML tags
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  });
};

/**
 * Sanitize HTML that may contain basic formatting
 * Allows safe tags like <b>, <i>, <p>, <br>
 * Use this for textareas or rich text fields
 * @param html - The HTML to sanitize
 * @returns Sanitized HTML with only safe tags
 */
export const sanitizeHTML = (html: string): string => {
  if (!html) return '';

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: []
  });
};

/**
 * Sanitize multiple text fields in an object
 * @param data - Object containing fields to sanitize
 * @param fields - Array of field names to sanitize
 * @returns Object with sanitized values
 */
export const sanitizeFields = <T extends Record<string, any>>(
  data: T,
  fields: (keyof T)[]
): T => {
  const sanitized = { ...data };

  fields.forEach((field) => {
    if (typeof sanitized[field] === 'string') {
      sanitized[field] = sanitizeText(sanitized[field] as string) as T[keyof T];
    }
  });

  return sanitized;
};

/**
 * Sanitize CMS rich text content - allows broader formatting for admin-authored content
 */
export const sanitizeCmsHTML = (html: string): string => {
  if (!html) return '';

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'blockquote'],
    ALLOWED_ATTR: ['href', 'target', 'rel']
  });
};

/**
 * Create a safe HTML string for rendering with dangerouslySetInnerHTML
 * Only use when you need to render user-generated HTML content
 * @param html - The HTML to sanitize
 * @returns Object compatible with dangerouslySetInnerHTML
 */
export const createSafeHTML = (html: string) => {
  return {
    __html: sanitizeHTML(html)
  };
};

/**
 * Create a safe CMS HTML string for rendering admin-authored content
 */
export const createSafeCmsHTML = (html: string) => {
  return {
    __html: sanitizeCmsHTML(html)
  };
};
