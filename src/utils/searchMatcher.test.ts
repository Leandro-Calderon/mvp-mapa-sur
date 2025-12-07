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
    describe('minimum character requirement', () => {
        it('should return false for queries with less than 3 valid characters', () => {
            expect(matchesStreetName('Pasaje 5', 'Pa')).toBe(false);
            expect(matchesStreetName('Pasaje 5', 'P')).toBe(false);
            expect(matchesStreetName('Av. San Martin', 'Av')).toBe(false);
        });

        it('should ignore spaces and dots when counting valid characters', () => {
            // "Av." has only 2 valid chars (A, v), dot doesn't count
            expect(matchesStreetName('Av. San Martin', 'Av.')).toBe(false);
            // "A. B" has only 2 valid chars (A, B), space and dot don't count
            expect(matchesStreetName('Av. San Martin', 'A. B')).toBe(false);
            // "A.B." has only 2 valid chars (A, B)
            expect(matchesStreetName('Av. San Martin', 'A.B.')).toBe(false);
        });

        it('should match with exactly 3 valid characters', () => {
            expect(matchesStreetName('Pellegrini', 'Pel')).toBe(true);
            expect(matchesStreetName('Av. San Martin', 'San')).toBe(true);
        });

        it('should match with spaces and dots if 3+ valid chars exist', () => {
            // "Av. S" has 3 valid chars (A, v, S)
            expect(matchesStreetName('Av. San Martin', 'Av. S')).toBe(true);
        });
    });

    describe('word boundary matching for numbers', () => {
        it('should match exact number at end of street name with 3+ digits', () => {
            expect(matchesStreetName('Calle 123', '123')).toBe(true);
            expect(matchesStreetName('Pasaje 555', '555')).toBe(true);
        });

        it('should NOT match number as part of larger number', () => {
            expect(matchesStreetName('Pasaje 5555', '555')).toBe(false);
        });

        it('should NOT match queries with less than 3 numeric characters', () => {
            expect(matchesStreetName('Pasaje 5', '5')).toBe(false);
            expect(matchesStreetName('Pasaje 55', '55')).toBe(false);
        });
    });

    describe('text matching', () => {
        it('should match text case-insensitively', () => {
            expect(matchesStreetName('Pasaje 5', 'pasaje')).toBe(true);
            expect(matchesStreetName('Pasaje 5', 'PASAJE')).toBe(true);
        });

        it('should match partial text with 3+ characters', () => {
            expect(matchesStreetName('Publica P', 'publica')).toBe(true);
            expect(matchesStreetName('Pasaje 2', 'pasaje')).toBe(true);
            expect(matchesStreetName('Pellegrini', 'ell')).toBe(true);
        });

        it('should match Rotonda de Giacomo', () => {
            expect(matchesStreetName('Rotonda de Giacomo', 'Rot')).toBe(true);
            expect(matchesStreetName('Rotonda de Giacomo', 'rotonda')).toBe(true);
            expect(matchesStreetName('Rotonda de Giacomo', 'giacomo')).toBe(true);
        });
    });

    describe('edge cases', () => {
        it('should return false for empty nombre', () => {
            expect(matchesStreetName('', 'abc')).toBe(false);
        });

        it('should return false for empty query', () => {
            expect(matchesStreetName('Pasaje 5', '')).toBe(false);
            expect(matchesStreetName('Pasaje 5', '   ')).toBe(false);
        });

        it('should handle query with leading/trailing whitespace', () => {
            expect(matchesStreetName('Pellegrini', '  Pel  ')).toBe(true);
        });
    });
});

