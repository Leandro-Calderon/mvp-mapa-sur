import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LocationButton } from './LocationButton';
import type { GpsErrorInfo } from '../hooks/useGeolocation';

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
        isLocating: false,
        error: null as GpsErrorInfo | null,
    };

    beforeEach(() => {
        vi.clearAllMocks();
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

    it('should show error state when error is provided', () => {
        const props = {
            ...defaultProps,
            error: { type: 'gps-disabled' as const, message: 'GPS error' },
        };

        render(<LocationButton {...props} />);

        const button = screen.getByRole('button', { name: /gps error/i });
        expect(button).toHaveClass('error');
    });

    it('should call onToggle with false when active button is clicked', () => {
        const onToggle = vi.fn();
        const props = {
            ...defaultProps,
            onToggle,
            isActive: true,
        };

        render(<LocationButton {...props} />);

        const button = screen.getByRole('button');
        fireEvent.click(button);

        expect(onToggle).toHaveBeenCalledWith(false);
    });

    it('should call onToggle with true when inactive button is clicked', () => {
        const onToggle = vi.fn();
        render(<LocationButton {...defaultProps} onToggle={onToggle} />);

        const button = screen.getByRole('button');
        fireEvent.click(button);

        expect(onToggle).toHaveBeenCalledWith(true);
    });

    it('should show GPS modal when error type is gps-disabled', () => {
        const props = {
            ...defaultProps,
            error: { type: 'gps-disabled' as const, message: 'GPS not available' },
        };

        render(<LocationButton {...props} />);

        expect(screen.getByTestId('gps-modal')).toBeInTheDocument();
    });

    it('should show GPS modal when error type is permission-denied', () => {
        const props = {
            ...defaultProps,
            error: { type: 'permission-denied' as const, message: 'Permission denied' },
        };

        render(<LocationButton {...props} />);

        expect(screen.getByTestId('gps-modal')).toBeInTheDocument();
    });

    it('should NOT show GPS modal for timeout errors', () => {
        const props = {
            ...defaultProps,
            error: { type: 'timeout' as const, message: 'Timeout' },
        };

        render(<LocationButton {...props} />);

        expect(screen.queryByTestId('gps-modal')).not.toBeInTheDocument();
    });

    it('should close GPS modal when close button is clicked', () => {
        const props = {
            ...defaultProps,
            error: { type: 'gps-disabled' as const, message: 'GPS not available' },
        };

        render(<LocationButton {...props} />);

        expect(screen.getByTestId('gps-modal')).toBeInTheDocument();

        const closeButton = screen.getByText('Close Modal');
        fireEvent.click(closeButton);

        expect(screen.queryByTestId('gps-modal')).not.toBeInTheDocument();
    });

    it('should show loading class when isLocating is true and not active', () => {
        const props = {
            ...defaultProps,
            isLocating: true,
        };

        render(<LocationButton {...props} />);

        const button = screen.getByRole('button');
        expect(button).toHaveClass('loading');
    });

    it('should not show loading class when active', () => {
        const props = {
            ...defaultProps,
            isActive: true,
            isLocating: true,
        };

        render(<LocationButton {...props} />);

        const button = screen.getByRole('button');
        expect(button).not.toHaveClass('loading');
        expect(button).toHaveClass('active');
    });

    it('should display error message in aria-label when error is present', () => {
        const props = {
            ...defaultProps,
            error: { type: 'gps-disabled' as const, message: 'GPS connection lost' },
        };

        render(<LocationButton {...props} />);

        const button = screen.getByRole('button', { name: 'GPS connection lost' });
        expect(button).toHaveAttribute('aria-label', 'GPS connection lost');
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
            error: { type: 'permission-denied' as const, message: 'Custom error' },
        };

        render(<LocationButton {...props} />);

        const button = screen.getByRole('button', { name: 'Custom error' });
        expect(button).toHaveAttribute('aria-label', 'Custom error');
    });

    it('should reflect prop-driven active state changes', () => {
        const { rerender } = render(<LocationButton {...defaultProps} />);

        let button = screen.getByRole('button');
        expect(button).toHaveClass('idle');

        rerender(<LocationButton {...defaultProps} isActive={true} />);

        button = screen.getByRole('button');
        expect(button).toHaveClass('active');
    });
});
