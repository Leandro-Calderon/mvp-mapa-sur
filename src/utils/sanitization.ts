export const sanitizeInput = (input: string, maxLength: number = 100): string => {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/[<>"'&]/g, '')
    .slice(0, maxLength);
};

export const sanitizeSearchQuery = (query: string): string => {
  return sanitizeInput(query, 50);
};

export const sanitizeNumericInput = (input: string, min: number = 0, max: number = 999999): number | null => {
  const sanitized = input.trim().replace(/[^0-9.-]/g, '');
  const num = Number(sanitized);

  if (!Number.isFinite(num) || num < min || num > max) {
    return null;
  }

  return num;
};
