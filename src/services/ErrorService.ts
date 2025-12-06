import { logger } from '../utils/logger';

/**
 * Centralized error handling service
 */
export class ErrorService {
    /**
     * Report an error with optional context
     */
    static report(error: Error, context?: Record<string, any>): void {
        logger.error(error.message, { error, context });

        // Future: Send to error tracking service in production
        // if (import.meta.env.PROD) {
        //   Sentry.captureException(error, { extra: context });
        // }
    }

    /**
     * Handle async operations with automatic error handling
     * Returns tuple of [data, error]
     */
    static async handleAsync<T>(
        promise: Promise<T>,
        context?: string
    ): Promise<[T | null, Error | null]> {
        try {
            const data = await promise;
            return [data, null];
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.report(err, { context });
            return [null, err];
        }
    }

    /**
     * Wrap a function with error handling
     */
    static wrap<T extends (...args: any[]) => any>(
        fn: T,
        context?: string
    ): (...args: Parameters<T>) => ReturnType<T> | void {
        return (...args: Parameters<T>) => {
            try {
                return fn(...args);
            } catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                this.report(err, { context, args });
            }
        };
    }
}
