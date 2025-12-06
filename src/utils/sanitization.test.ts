import { describe, it, expect } from 'vitest';
import { sanitizeSearchQuery, sanitizeInput, sanitizeNumericInput } from './sanitization';

describe('sanitizeInput', () => {
    it('should trim whitespace', () => {
        expect(sanitizeInput('  test  ')).toBe('test');
    });

    it('should remove dangerous characters', () => {
        expect(sanitizeInput('test<script>')).toBe('testscript');
        expect(sanitizeInput('test"quote"')).toBe('testquote');
        expect(sanitizeInput("test'quote'")).toBe('testquote');
        expect(sanitizeInput('test&amp;')).toBe('testamp;');
    });

    it('should respect max length', () => {
        expect(sanitizeInput('a'.repeat(200), 50)).toHaveLength(50);
    });

    it('should handle empty string', () => {
        expect(sanitizeInput('')).toBe('');
    });

    it('should handle non-string input', () => {
        expect(sanitizeInput(123 as any)).toBe('');
        expect(sanitizeInput(null as any)).toBe('');
    });
});

describe('sanitizeSearchQuery', () => {
    it('should trim whitespace from query', () => {
        expect(sanitizeSearchQuery('  test  ')).toBe('test');
    });

    it('should remove special HTML characters', () => {
        expect(sanitizeSearchQuery('test<>')).toBe('test');
    });

    it('should handle empty strings', () => {
        expect(sanitizeSearchQuery('')).toBe('');
        expect(sanitizeSearchQuery('   ')).toBe('');
    });

    it('should limit to 50 characters', () => {
        expect(sanitizeSearchQuery('a'.repeat(100))).toHaveLength(50);
    });
});

describe('sanitizeNumericInput', () => {
    it('should parse valid numbers', () => {
        expect(sanitizeNumericInput('123')).toBe(123);
        expect(sanitizeNumericInput('  456  ')).toBe(456);
    });

    it('should handle negative numbers when min allows it', () => {
        // Default min is 0, so negative numbers return null
        expect(sanitizeNumericInput('-10')).toBeNull();
        // But if we set min to allow negatives, it works
        expect(sanitizeNumericInput('-10', -100, 100)).toBe(-10);
    });

    it('should return null for out of range input', () => {
        // Empty string becomes 0, which is within default range (0-999999)
        expect(sanitizeNumericInput('')).toBe(0);
        // But if we set a min > 0, empty string (0) would be null
        expect(sanitizeNumericInput('', 1, 100)).toBeNull();
        // Pure text that becomes empty after sanitization: 'abc' -> '' -> 0
        expect(sanitizeNumericInput('abc')).toBe(0);
    });

    it('should respect min/max bounds', () => {
        expect(sanitizeNumericInput('5', 10, 20)).toBeNull();
        expect(sanitizeNumericInput('25', 10, 20)).toBeNull();
        expect(sanitizeNumericInput('15', 10, 20)).toBe(15);
    });

    it('should remove non-numeric characters', () => {
        expect(sanitizeNumericInput('abc123def')).toBe(123);
    });
});
