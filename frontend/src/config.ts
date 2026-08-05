/* ==========================================
   APPLICATION CONFIGURATION
   ========================================== */

/**
 * Central configuration file for environment variables and app settings
 * Update these values based on your deployment environment
 */

// API Base URL - defaults to localhost for development
// In production, set VITE_API_BASE_URL environment variable
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// API Endpoints
export const API_ENDPOINTS = {
  // Customer-facing endpoints
  REQUESTS: `${API_BASE_URL}/requests`,
  SERVICES: `${API_BASE_URL}/services`,

  // Admin endpoints (protected - require authentication)
  ADMIN_DASHBOARD: `${API_BASE_URL}/admin/dashboard`,
  ADMIN_QUOTES: `${API_BASE_URL}/quotes`,
  ADMIN_CALENDAR: `${API_BASE_URL}/admin/calendar`,
  ADMIN_CONVERT_TO_JOB: (id: number) => `${API_BASE_URL}/quotes/${id}/convert_to_job`,
  ADMIN_RESCHEDULE: (id: number) => `${API_BASE_URL}/admin/calendar/${id}/reschedule`,

  // Request actions
  SEND_COMPLETION_EMAIL: (id: number) => `${API_BASE_URL}/requests/${id}/send_completion_email`,

  // Customer management
  ADMIN_CUSTOMERS: `${API_BASE_URL}/admin/customers`,
  ADMIN_CUSTOMER: (id: number) => `${API_BASE_URL}/admin/customers/${id}`,

  // CMS endpoints
  CONTENT: (page: string) => `${API_BASE_URL}/content?page=${page}`,
  ADMIN_CONTENT: `${API_BASE_URL}/admin/content`,
  ADMIN_CONTENT_BULK: `${API_BASE_URL}/admin/content/bulk_update`,
  ADMIN_FAVICON: `${API_BASE_URL}/admin/content/favicon`,
  ADMIN_LOGO: `${API_BASE_URL}/admin/content/logo`,

  // Gallery endpoints
  GALLERY: `${API_BASE_URL}/gallery`,
  ADMIN_GALLERY: `${API_BASE_URL}/admin/gallery`,
  ADMIN_GALLERY_UPDATE: (id: number) => `${API_BASE_URL}/admin/gallery/${id}`,

  // Reviews endpoints
  REVIEWS: `${API_BASE_URL}/reviews`,
  ADMIN_REVIEWS: `${API_BASE_URL}/admin/reviews`,
  ADMIN_REVIEWS_UPDATE: (id: number) => `${API_BASE_URL}/admin/reviews/${id}`,

  // Google Calendar endpoints
  ADMIN_GCAL_AUTH: `${API_BASE_URL}/admin/google-calendar/auth-url`,
  ADMIN_GCAL_CALLBACK: `${API_BASE_URL}/admin/google-calendar/callback`,
  ADMIN_GCAL_STATUS: `${API_BASE_URL}/admin/google-calendar/status`,
  ADMIN_GCAL_DISCONNECT: `${API_BASE_URL}/admin/google-calendar/disconnect`,
  ADMIN_GCAL_SYNC: `${API_BASE_URL}/admin/google-calendar/sync`,
  ADMIN_GCAL_SETTINGS: `${API_BASE_URL}/admin/google-calendar/settings`,

  // Auth endpoints
  LOGIN: `${API_BASE_URL}/auth/login`,
  LOGOUT: `${API_BASE_URL}/auth/logout`,
  VERIFY: `${API_BASE_URL}/auth/verify`,
  REFRESH: `${API_BASE_URL}/auth/refresh`,
};

// App metadata
export const APP_CONFIG = {
  name: 'MyCompany Auto Service',
  version: '1.0.0',
  description: 'Quality Automotive Care You Can Trust',
};