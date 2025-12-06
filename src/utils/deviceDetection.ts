/**
 * Device detection utilities
 * These are evaluated once at module load time for better performance
 */

// Detect if we're on a mobile device
export const isMobile = typeof navigator !== 'undefined'
    ? /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    : false;

// Detect if we're on a touch device
export const isTouchDevice = typeof navigator !== 'undefined'
    ? ('ontouchstart' in window || navigator.maxTouchPoints > 0)
    : false;

// Detect if we're on iOS
export const isIOS = typeof navigator !== 'undefined'
    ? /iPhone|iPad|iPod/i.test(navigator.userAgent)
    : false;

// Detect if we're on Android
export const isAndroid = typeof navigator !== 'undefined'
    ? /Android/i.test(navigator.userAgent)
    : false;
