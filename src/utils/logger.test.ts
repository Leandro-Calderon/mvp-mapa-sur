import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as Sentry from '@sentry/react';
import { logger } from './logger';

vi.mock('@sentry/react', () => ({
    init: vi.fn(),
    captureException: vi.fn(),
}));

const captureException = vi.mocked(Sentry.captureException);
const sentryInit = vi.mocked(Sentry.init);
const DSN = 'https://public@example.ingest.sentry.io/1234567';

describe('logger', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should have debug, info, warn, and error methods', () => {
        expect(logger.debug).toBeDefined();
        expect(logger.info).toBeDefined();
        expect(logger.warn).toBeDefined();
        expect(logger.error).toBeDefined();
    });

    it('should accept message and optional data parameters', () => {
        expect(() => logger.debug('test message')).not.toThrow();
        expect(() => logger.debug('test message', { key: 'value' })).not.toThrow();
        expect(() => logger.info('test info')).not.toThrow();
        expect(() => logger.warn('test warning')).not.toThrow();
        expect(() => logger.error('test error')).not.toThrow();
    });
});

describe('logger Sentry integration', () => {
    const originalError = console.error;

    beforeEach(() => {
        vi.clearAllMocks();
        console.error = vi.fn();
    });

    afterEach(() => {
        console.error = originalError;
        vi.unstubAllEnvs();
    });

    it('should report errors to Sentry when a DSN is configured', () => {
        vi.stubEnv('VITE_SENTRY_DSN', DSN);
        const error = new Error('boom');

        logger.error('Something failed', error);

        expect(captureException).toHaveBeenCalledTimes(1);
        expect(captureException).toHaveBeenCalledWith(error, {
            extra: { message: 'Something failed' },
        });
    });

    it('should capture exactly once and merge extra context flat into the event extra', () => {
        vi.stubEnv('VITE_SENTRY_DSN', DSN);
        const error = new Error('boom');

        logger.error('Something failed', error, { source: 'cache' });

        expect(captureException).toHaveBeenCalledTimes(1);
        expect(captureException).toHaveBeenCalledWith(error, {
            extra: { message: 'Something failed', source: 'cache' },
        });
    });

    it('should create an Error from the message when no error object is provided', () => {
        vi.stubEnv('VITE_SENTRY_DSN', DSN);

        logger.error('Something failed');

        expect(captureException).toHaveBeenCalledTimes(1);
        const reported = captureException.mock.calls.at(0)?.[0];
        expect(reported).toBeInstanceOf(Error);
        expect((reported as Error).message).toBe('Something failed');
    });

    it('should not report debug, info or warn levels to Sentry', () => {
        vi.stubEnv('VITE_SENTRY_DSN', DSN);

        logger.debug('debug message');
        logger.info('info message');
        logger.warn('warn message');

        expect(captureException).not.toHaveBeenCalled();
    });

    it('should not report to Sentry when no DSN is configured', () => {
        logger.error('Something failed', new Error('boom'));

        expect(captureException).not.toHaveBeenCalled();
    });

    it('should never initialize Sentry from the logger', () => {
        vi.stubEnv('VITE_SENTRY_DSN', DSN);

        logger.error('Something failed');

        expect(sentryInit).not.toHaveBeenCalled();
    });
});
