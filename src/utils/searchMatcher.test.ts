import { describe, it, expect } from 'vitest';
import { matchesBuildingName, matchesStreetName } from './searchMatcher';

describe('matchesBuildingName', () => {
    describe('exact numeric matching', () => {
        it('should match exact number', () => {
            expect(matchesBuildingName(5, '5')).toBe(true);
        });

        it('should NOT match number containing query as substring', () => {
            expect(matchesBuildingName(35, '5')).toBe(false);
            expect(matchesBuildingName(85, '5')).toBe(false);
            expect(matchesBuildingName(55, '5')).toBe(false);
            expect(matchesBuildingName(105, '5')).toBe(false);
        });

        it('should match multi-digit numbers exactly', () => {
            expect(matchesBuildingName(35, '35')).toBe(true);
            expect(matchesBuildingName(123, '123')).toBe(true);
        });
    });

    describe('case-insensitive letter matching', () => {
        it('should match lowercase query to uppercase name', () => {
            expect(matchesBuildingName('D', 'd')).toBe(true);
        });

        it('should match uppercase query to uppercase name', () => {
            expect(matchesBuildingName('D', 'D')).toBe(true);
        });

        it('should match mixed case', () => {
            expect(matchesBuildingName('A', 'a')).toBe(true);
            expect(matchesBuildingName('j', 'J')).toBe(true);
            expect(matchesBuildingName('B', 'b')).toBe(true);
        });

        it('should NOT match different letters', () => {
            expect(matchesBuildingName('D', 'A')).toBe(false);
            expect(matchesBuildingName('A', 'B')).toBe(false);
        });
    });

    describe('edge cases', () => {
        it('should return false for null nombre', () => {
            expect(matchesBuildingName(null, '5')).toBe(false);
        });

        it('should return false for empty query', () => {
            expect(matchesBuildingName(5, '')).toBe(false);
            expect(matchesBuildingName(5, '   ')).toBe(false);
        });

        it('should handle query with whitespace', () => {
            expect(matchesBuildingName(5, '  5  ')).toBe(true);
            expect(matchesBuildingName('D', '  d  ')).toBe(true);
        });

        it('should handle string numbers', () => {
            expect(matchesBuildingName('5', '5')).toBe(true);
            expect(matchesBuildingName('35', '5')).toBe(false);
        });
    });
});

describe('matchesStreetName', () => {
    describe('word boundary matching for numbers', () => {
        it('should match exact number at end of street name', () => {
            expect(matchesStreetName('Pasaje 5', '5')).toBe(true);
        });

        it('should NOT match number as part of larger number', () => {
            expect(matchesStreetName('Pasaje 55', '5')).toBe(false);
            expect(matchesStreetName('Calle 35', '5')).toBe(false);
        });

        it('should match multi-digit numbers with word boundary', () => {
            expect(matchesStreetName('Pasaje 55', '55')).toBe(true);
            expect(matchesStreetName('Calle 123', '123')).toBe(true);
        });
    });

    describe('text matching', () => {
        it('should match text case-insensitively', () => {
            expect(matchesStreetName('Pasaje 5', 'pasaje')).toBe(true);
            expect(matchesStreetName('Pasaje 5', 'PASAJE')).toBe(true);
        });

        it('should match partial text', () => {
            expect(matchesStreetName('Publica P', 'publica')).toBe(true);
            expect(matchesStreetName('Pasaje 2', 'pasaje')).toBe(true);
        });
    });

    describe('edge cases', () => {
        it('should return false for empty nombre', () => {
            expect(matchesStreetName('', '5')).toBe(false);
        });

        it('should return false for empty query', () => {
            expect(matchesStreetName('Pasaje 5', '')).toBe(false);
            expect(matchesStreetName('Pasaje 5', '   ')).toBe(false);
        });

        it('should handle query with whitespace', () => {
            expect(matchesStreetName('Pasaje 5', '  5  ')).toBe(true);
        });
    });
});
