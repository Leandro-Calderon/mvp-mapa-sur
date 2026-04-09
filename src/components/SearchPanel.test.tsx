import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchPanel, SearchType } from './SearchPanel';
import styles from './SearchPanel.module.css';

describe('SearchPanel', () => {
    const defaultProps = {
        searchQuery: '',
        searchType: 'edificio' as SearchType,
        appliedQuery: '',
        appliedType: null as SearchType | null,
        onQueryChange: vi.fn(),
        onTypeChange: vi.fn(),
        onSubmit: vi.fn(),
        onClear: vi.fn(),
        onShowAllToggle: vi.fn(),
        showAllLayers: false,
        buildingResults: 0,
        streetResults: 0,
        searchResults: 0,
        collapsed: false,
        onToggleCollapse: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render with default state', () => {
        render(<SearchPanel {...defaultProps} />);

        expect(screen.getByText('🏢 Edificio')).toBeInTheDocument();
        expect(screen.getByText('🚪 Departamento')).toBeInTheDocument();
        expect(screen.getByText('🛣️ Calle')).toBeInTheDocument();
        expect(screen.getByText('📋 Plan')).toBeInTheDocument();
    });

    it('should show placeholder for current search type', () => {
        render(<SearchPanel {...defaultProps} />);

        const input = screen.getByPlaceholderText(/Ej: 86, D, 22/i);
        expect(input).toBeInTheDocument();
    });

    it('should call onQueryChange when input changes', () => {
        render(<SearchPanel {...defaultProps} />);

        const input = screen.getByPlaceholderText(/Ej: 86, D, 22/i);
        fireEvent.change(input, { target: { value: 'Torre 5' } });

        expect(defaultProps.onQueryChange).toHaveBeenCalledWith('Torre 5');
    });

    it('should call onSubmit when Enter key is pressed', () => {
        render(<SearchPanel {...defaultProps} />);

        const input = screen.getByPlaceholderText(/Ej: 86, D, 22/i);
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

        expect(defaultProps.onSubmit).toHaveBeenCalled();
    });

    it('should change search type when type button is clicked', () => {
        render(<SearchPanel {...defaultProps} />);

        const departamentoButton = screen.getByText('🚪 Departamento');
        fireEvent.click(departamentoButton);

        expect(defaultProps.onTypeChange).toHaveBeenCalledWith('departamento');
    });

    it('should not call onTypeChange if same type is clicked', () => {
        render(<SearchPanel {...defaultProps} />);

        const edificioButton = screen.getByText('🏢 Edificio');
        fireEvent.click(edificioButton);

        expect(defaultProps.onTypeChange).not.toHaveBeenCalled();
    });

    it('should display search results count', () => {
        const props = {
            ...defaultProps,
            appliedQuery: 'Torre',
            appliedType: 'edificio' as SearchType,
            searchResults: 5,
        };

        render(<SearchPanel {...props} />);

        expect(screen.getByText('5 resultados encontrados')).toBeInTheDocument();
    });

    it('should display singular result text for 1 result', () => {
        const props = {
            ...defaultProps,
            appliedQuery: 'Torre',
            appliedType: 'edificio' as SearchType,
            searchResults: 1,
        };

        render(<SearchPanel {...props} />);

        expect(screen.getByText('1 resultado encontrado')).toBeInTheDocument();
    });

    it('should show warning when no results found', () => {
        const props = {
            ...defaultProps,
            appliedQuery: 'XYZ',
            appliedType: 'edificio' as SearchType,
            searchResults: 0,
        };

        render(<SearchPanel {...props} />);

        expect(screen.getByText(/No encontramos coincidencias/i)).toBeInTheDocument();
    });

    it('should show clear button when there is a query', () => {
        const props = { ...defaultProps, searchQuery: 'Torre 5' };

        render(<SearchPanel {...props} />);

        const clearButton = screen.getByText('×');
        expect(clearButton).toBeInTheDocument();
    });

    it('should call onClear when clear button is clicked', () => {
        const props = { ...defaultProps, searchQuery: 'Torre 5' };

        render(<SearchPanel {...props} />);

        const clearButton = screen.getByText('×');
        fireEvent.click(clearButton);

        expect(defaultProps.onClear).toHaveBeenCalled();
    });

    it('should toggle "Ver Todo" button', () => {
        render(<SearchPanel {...defaultProps} />);

        const verTodoButton = screen.getByText('Ver Todo');
        fireEvent.click(verTodoButton);

        expect(defaultProps.onShowAllToggle).toHaveBeenCalled();
    });

    it('should apply active class to "Ver Todo" when showAllLayers is true', () => {
        const props = { ...defaultProps, showAllLayers: true };

        render(<SearchPanel {...props} />);

        const verTodoButton = screen.getByText('Ver Todo').closest('button');
        expect(verTodoButton?.className).toContain(styles.active);
    });

    it('should toggle panel collapsed state', () => {
        render(<SearchPanel {...defaultProps} />);

        // The header is the parent of the search icon
        const searchIcon = screen.getByText('🔍');
        const header = searchIcon.closest('div')?.parentElement;
        fireEvent.click(header!);

        expect(defaultProps.onToggleCollapse).toHaveBeenCalledWith(true);
    });

    it('should show correct placeholder for departamento type', () => {
        const props = { ...defaultProps, searchType: 'departamento' as SearchType };

        render(<SearchPanel {...props} />);

        expect(screen.getByPlaceholderText(/Ej: 543, 204, 15/i)).toBeInTheDocument();
    });

    it('should show correct placeholder for calle type', () => {
        const props = { ...defaultProps, searchType: 'calle' as SearchType };

        render(<SearchPanel {...props} />);

        expect(screen.getByPlaceholderText(/Ej: Publica P, Pasaje 2/i)).toBeInTheDocument();
    });

    it('should show correct placeholder for plan type', () => {
        const props = { ...defaultProps, searchType: 'plan' as SearchType };

        render(<SearchPanel {...props} />);

        expect(screen.getByPlaceholderText(/Ej: 077, 123/i)).toBeInTheDocument();
    });

    it('should apply collapsed class when collapsed prop is true', () => {
        const props = { ...defaultProps, collapsed: true };

        render(<SearchPanel {...props} />);

        // The panel div is the outermost container — find it via the search icon
        const panel = screen.getByText('🔍').closest('div')?.parentElement?.parentElement;
        expect(panel?.className).toContain(styles.collapsed);
    });

    it('should apply idle class when no query is present', () => {
        render(<SearchPanel {...defaultProps} />);

        const panel = screen.getByText('🔍').closest('div')?.parentElement?.parentElement;
        expect(panel?.className).toContain(styles.idle);
    });

    it('should highlight active search type button', () => {
        const props = { ...defaultProps, searchType: 'departamento' as SearchType };

        render(<SearchPanel {...props} />);

        const departamentoButton = screen.getByText('🚪 Departamento').closest('button');
        expect(departamentoButton?.className).toContain(styles.active);
    });

    it('should show preview text for active search', () => {
        const props = {
            ...defaultProps,
            appliedQuery: 'Torre 5',
            appliedType: 'edificio' as SearchType,
        };

        render(<SearchPanel {...props} />);

        expect(screen.getByText(/Buscando edificio: Torre 5/i)).toBeInTheDocument();
    });
});
