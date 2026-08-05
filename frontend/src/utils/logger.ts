/* ==========================================
   LOGGER UTILITY
   ========================================== */

/**
 * Simple logging utility that only logs in development mode
 * In production, errors can be sent to a logging service
 */

const isDevelopment = import.meta.env.MODE === 'development';

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  error: (...args: any[]) => {
    if (isDevelopment) {
      console.error(...args);
    }
    // In production, you might want to send to error tracking service
    // Example: Sentry.captureException(args[0]);
  },

  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
};
