import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as Sentry from '@sentry/react';
import { ErrorService } from './ErrorService';

vi.mock('@sentry/react', () => ({
    init: vi.fn(),
    captureException: vi.fn(),
}));

const captureException = vi.mocked(Sentry.captureException);
const sentryInit = vi.mocked(Sentry.init);
const DSN = 'https://public@example.ingest.sentry.io/1234567';

describe('ErrorService', () => {
    describe('report', () => {
        it('should accept error and optional context', () => {
            const error = new Error('Test error');
            expect(() => ErrorService.report(error)).not.toThrow();
            expect(() => ErrorService.report(error, { context: 'test' })).not.toThrow();
        });
    });

describe('ErrorService Sentry integration', () => {
    const originalError = console.error;

    beforeEach(() => {
        vi.clearAllMocks();
        console.error = vi.fn();
    });

    afterEach(() => {
        console.error = originalError;
        vi.unstubAllEnvs();
    });

    it('should capture the error exactly once with context merged into extra when a DSN is configured', () => {
        vi.stubEnv('VITE_SENTRY_DSN', DSN);
        const error = new Error('Service failed');
        const context = { source: 'cache' };

        ErrorService.report(error, context);

        expect(captureException).toHaveBeenCalledTimes(1);
        expect(captureException).toHaveBeenCalledWith(error, {
            extra: { message: 'Service failed', source: 'cache' },
        });
    });

    it('should capture the error exactly once with message-only extra when no context is provided', () => {
        vi.stubEnv('VITE_SENTRY_DSN', DSN);
        const error = new Error('Service failed');

        ErrorService.report(error);

        expect(captureException).toHaveBeenCalledTimes(1);
        expect(captureException).toHaveBeenCalledWith(error, {
            extra: { message: 'Service failed' },
        });
    });

    it('should not report to Sentry when no DSN is configured', () => {
        ErrorService.report(new Error('Service failed'), { source: 'cache' });

        expect(captureException).not.toHaveBeenCalled();
    });

    it('should never initialize Sentry from the service', () => {
        vi.stubEnv('VITE_SENTRY_DSN', DSN);

        ErrorService.report(new Error('Service failed'));

        expect(sentryInit).not.toHaveBeenCalled();
    });
});

    describe('handleAsync', () => {
        it('should return data when promise resolves', async () => {
            const promise = Promise.resolve('success');
            const [data, error] = await ErrorService.handleAsync(promise);

            expect(data).toBe('success');
            expect(error).toBeNull();
        });

        it('should return error when promise rejects', async () => {
            const promise = Promise.reject(new Error('Failed'));
            const [data, error] = await ErrorService.handleAsync(promise);

            expect(data).toBeNull();
            expect(error).toBeInstanceOf(Error);
            expect(error?.message).toBe('Failed');
        });

        it('should handle non-Error rejections', async () => {
            const promise = Promise.reject('string error');
            const [data, error] = await ErrorService.handleAsync(promise);

            expect(data).toBeNull();
            expect(error).toBeInstanceOf(Error);
            expect(error?.message).toBe('string error');
        });
    });

    describe('wrap', () => {
        it('should wrap function and return result on success', () => {
            const fn = (x: number, y: number) => x + y;
            const wrapped = ErrorService.wrap(fn);

            expect(wrapped(2, 3)).toBe(5);
        });

        it('should catch errors and not throw', () => {
            const fn = () => {
                throw new Error('Test error');
            };
            const wrapped = ErrorService.wrap(fn);

            expect(() => wrapped()).not.toThrow();
        });
    });
});
