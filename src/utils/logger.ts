export const logger = {
  debug: (message: string, data?: unknown): void => {
    if (import.meta.env.DEV) {
      console.log(`[DEBUG] ${message}`, data);
    }
  },

  error: (message: string, error?: Error): void => {
    console.error(`[ERROR] ${message}`, error);
  },

  warn: (message: string, data?: unknown): void => {
    if (import.meta.env.DEV) {
      console.warn(`[WARN] ${message}`, data);
    }
  },

  info: (message: string, data?: unknown): void => {
    if (import.meta.env.DEV) {
      console.info(`[INFO] ${message}`, data);
    }
  }
};
