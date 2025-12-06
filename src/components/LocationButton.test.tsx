import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LocationButton } from './LocationButton';

// Mock GpsDisabledModal
vi.mock('./GpsDisabledModal', () => ({
    GpsDisabledModal: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
        isOpen ? (
            <div data-testid="gps-modal">
                <button onClick={onClose}>Close Modal</button>
            </div>
        ) : null
    ),
}));

// Mock logger
vi.mock('../utils/logger', () => ({
    logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

describe('LocationButton', () => {
    const defaultProps = {
        onToggle: vi.fn(),
        isActive: false,
        isTracking: false,
        hasError: false,
        errorMessage: null,
    };

    let mockGeolocation: {
        getCurrentPosition: ReturnType<typeof vi.fn>;
        watchPosition: ReturnType<typeof vi.fn>;
        clearWatch: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock geolocation API
        mockGeolocation = {
            getCurrentPosition: vi.fn(),
            watchPosition: vi.fn(),
            clearWatch: vi.fn(),
        };

        Object.defineProperty(globalThis.navigator, 'geolocation', {
            writable: true,
            configurable: true,
            value: mockGeolocation,
        });

        // Mock permissions API
        Object.defineProperty(globalThis.navigator, 'permissions', {
            writable: true,
            configurable: true,
            value: {
                query: vi.fn().mockResolvedValue({ state: 'granted' }),
            },
        });
    });

    it('should render location button', () => {
        render(<LocationButton {...defaultProps} />);

        const button = screen.getByRole('button', { name: /activar ubicación/i });
        expect(button).toBeInTheDocument();
    });

    it('should show inactive state by default', () => {
        render(<LocationButton {...defaultProps} />);

        const button = screen.getByRole('button');
        expect(button).toHaveClass('idle');
        expect(button).not.toHaveClass('active');
    });

    it('should show active state when isActive is true', () => {
        const props = {
            ...defaultProps,
            isActive: true,
        };

        render(<LocationButton {...props} />);

        const button = screen.getByRole('button');
        expect(button).toHaveClass('active');
    });

    it('should show error state when hasError is true', () => {
        const props = {
            ...defaultProps,
            hasError: true,
            errorMessage: 'GPS error',
        };

        render(<LocationButton {...props} />);

        const button = screen.getByRole('button');
        expect(button).toHaveClass('error');
    });

    it('should call onToggle with false when active button is clicked', () => {
        const props = {
            ...defaultProps,
            isActive: true,
        };

        render(<LocationButton {...props} />);

        const button = screen.getByRole('button');
        fireEvent.click(button);

        expect(defaultProps.onToggle).toHaveBeenCalledWith(false);
    });

    it('should check geolocation support before activating', async () => {
        render(<LocationButton {...defaultProps} />);

        const button = screen.getByRole('button');
        fireEvent.click(button);

        await waitFor(() => {
            expect(navigator.permissions.query).toHaveBeenCalledWith({ name: 'geolocation' });
        });
    });

    it('should handle successful geolocation permission', async () => {
        const mockPosition: GeolocationPosition = {
            coords: {
                latitude: 40.7128,
                longitude: -74.006,
                accuracy: 10,
                altitude: null,
                altitudeAccuracy: null,
                heading: null,
                speed: null,
                toJSON: () => ({}),
            },
            timestamp: Date.now(),
        };

        mockGeolocation.getCurrentPosition.mockImplementation((success) => {
            success(mockPosition);
        });

        render(<LocationButton {...defaultProps} />);

        const button = screen.getByRole('button');
        fireEvent.click(button);

        await waitFor(() => {
            expect(defaultProps.onToggle).toHaveBeenCalledWith(true);
        });
    });

    it('should show GPS disabled modal on permission denied', async () => {
        Object.defineProperty(globalThis.navigator, 'permissions', {
            writable: true,
            configurable: true,
            value: {
                query: vi.fn().mockResolvedValue({ state: 'denied' }),
            },
        });

        render(<LocationButton {...defaultProps} />);

        const button = screen.getByRole('button');
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByTestId('gps-modal')).toBeInTheDocument();
        });
    });

    it('should close GPS modal when close button is clicked', async () => {
        Object.defineProperty(globalThis.navigator, 'permissions', {
            writable: true,
            configurable: true,
            value: {
                query: vi.fn().mockResolvedValue({ state: 'denied' }),
            },
        });

        render(<LocationButton {...defaultProps} />);

        const button = screen.getByRole('button');
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByTestId('gps-modal')).toBeInTheDocument();
        });

        const closeButton = screen.getByText('Close Modal');
        fireEvent.click(closeButton);

        await waitFor(() => {
            expect(screen.queryByTestId('gps-modal')).not.toBeInTheDocument();
        });
    });

    it('should handle geolocation not supported', async () => {
        Object.defineProperty(globalThis.navigator, 'geolocation', {
            writable: true,
            configurable: true,
            value: undefined,
        });

        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => { });

        render(<LocationButton {...defaultProps} />);

        const button = screen.getByRole('button');
        fireEvent.click(button);

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith(
                expect.stringContaining('no es compatible')
            );
        });

        alertSpy.mockRestore();
    });

    it('should handle GPS position unavailable error', async () => {
        const mockError: GeolocationPositionError = {
            code: 2,
            message: 'Position unavailable',
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
        };

        mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
            // First call checks status
            error!(mockError);
        });

        render(<LocationButton {...defaultProps} />);

        const button = screen.getByRole('button');
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.queryByTestId('gps-modal')).toBeInTheDocument();
        });
    });

    it('should sync internal state with prop changes', () => {
        const { rerender } = render(<LocationButton {...defaultProps} />);

        let button = screen.getByRole('button');
        expect(button).toHaveClass('idle');

        rerender(<LocationButton {...defaultProps} isActive={true} />);

        button = screen.getByRole('button');
        expect(button).toHaveClass('active');
    });

    it('should display error message in title when hasError is true', () => {
        const props = {
            ...defaultProps,
            hasError: true,
            errorMessage: 'GPS connection lost',
        };

        render(<LocationButton {...props} />);

        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('title', expect.stringContaining('GPS connection lost'));
    });

    it('should display correct aria-label for active state', () => {
        const props = {
            ...defaultProps,
            isActive: true,
        };

        render(<LocationButton {...props} />);

        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('aria-label', 'Desactivar ubicación');
    });

    it('should display correct aria-label for inactive state', () => {
        render(<LocationButton {...defaultProps} />);

        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('aria-label', 'Activar ubicación');
    });

    it('should display correct aria-label for error state', () => {
        const props = {
            ...defaultProps,
            hasError: true,
            errorMessage: 'Custom error',
        };

        render(<LocationButton {...props} />);

        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('aria-label', 'Custom error');
    });

    it('should handle permission check timeout', async () => {
        mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
            const mockError: GeolocationPositionError = {
                code: 3,
                message: 'Timeout',
                PERMISSION_DENIED: 1,
                POSITION_UNAVAILABLE: 2,
                TIMEOUT: 3,
            };
            error!(mockError);
        });

        render(<LocationButton {...defaultProps} />);

        const button = screen.getByRole('button');
        fireEvent.click(button);

        // Should proceed with normal request on timeout
        await waitFor(() => {
            expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
        });
    });
});
