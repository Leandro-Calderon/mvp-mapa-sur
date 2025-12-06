import { describe, it, expect } from 'vitest';
import { ErrorService } from './ErrorService';

describe('ErrorService', () => {
    describe('report', () => {
        it('should accept error and optional context', () => {
            const error = new Error('Test error');
            expect(() => ErrorService.report(error)).not.toThrow();
            expect(() => ErrorService.report(error, { context: 'test' })).not.toThrow();
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
