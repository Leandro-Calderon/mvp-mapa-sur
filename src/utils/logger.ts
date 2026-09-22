import * as Sentry from '@sentry/react';

const isDev = import.meta.env.DEV;

export const logger = {
  debug: (message: string, data?: unknown) => {
    if (isDev) {
      console.log(`[DEBUG] ${message}`, data);
    }
  },

  info: (message: string, data?: unknown) => {
    if (isDev) {
      console.info(`[INFO] ${message}`, data);
    }
  },

  warn: (message: string, data?: unknown) => {
    console.warn(`[WARN] ${message}`, data);
  },

  error: (
    message: string,
    error?: unknown,
    extra?: Record<string, unknown>
  ) => {
    console.error(`[ERROR] ${message}`, error);
    // Single Sentry capture point for the whole app: callers pass extra
    // context through here. Without a DSN the capture never happens and
    // the logger behaves as before.
    if (import.meta.env.VITE_SENTRY_DSN) {
      Sentry.captureException(error ?? new Error(message), {
        extra: { message, ...extra },
      });
    }
  }
};
