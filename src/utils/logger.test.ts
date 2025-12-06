import { describe, it, expect, beforeEach, vi } from 'vitest';
import { logger } from './logger';

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
