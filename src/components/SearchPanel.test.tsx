import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchPanel, SearchType } from './SearchPanel';

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
        suggestions: [] as { value: string }[],
        onSuggestionSelect: vi.fn(),
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

        // Should not be called since 'edificio' is already selected
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
        const props = {
            ...defaultProps,
            searchQuery: 'Torre 5',
        };

        render(<SearchPanel {...props} />);

        const clearButton = screen.getByText('×');
        expect(clearButton).toBeInTheDocument();
    });

    it('should call onClear when clear button is clicked', () => {
        const props = {
            ...defaultProps,
            searchQuery: 'Torre 5',
        };

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
        const props = {
            ...defaultProps,
            showAllLayers: true,
        };

        render(<SearchPanel {...props} />);

        const verTodoButton = screen.getByText('Ver Todo').closest('button');
        expect(verTodoButton).toHaveClass('active');
    });

    it('should toggle panel collapsed state', () => {
        render(<SearchPanel {...defaultProps} />);

        const header = screen.getByText('🔍').closest('.search-header');
        fireEvent.click(header!);

        expect(defaultProps.onToggleCollapse).toHaveBeenCalledWith(true);
    });

    it('should show correct placeholder for departamento type', () => {
        const props = {
            ...defaultProps,
            searchType: 'departamento' as SearchType,
        };

        render(<SearchPanel {...props} />);

        expect(screen.getByPlaceholderText(/Ej: 543, 204, 15/i)).toBeInTheDocument();
    });

    it('should show correct placeholder for calle type', () => {
        const props = {
            ...defaultProps,
            searchType: 'calle' as SearchType,
        };

        render(<SearchPanel {...props} />);

        expect(screen.getByPlaceholderText(/Ej: Publica P, Pasaje 2/i)).toBeInTheDocument();
    });

    it('should show correct placeholder for plan type', () => {
        const props = {
            ...defaultProps,
            searchType: 'plan' as SearchType,
        };

        render(<SearchPanel {...props} />);

        expect(screen.getByPlaceholderText(/Ej: 077, 123/i)).toBeInTheDocument();
    });

    it('should apply collapsed class when collapsed prop is true', () => {
        const props = {
            ...defaultProps,
            collapsed: true,
        };

        render(<SearchPanel {...props} />);

        const panel = screen.getByText('🔍').closest('.search-panel');
        expect(panel).toHaveClass('collapsed');
    });

    it('should apply idle class when no query is present', () => {
        render(<SearchPanel {...defaultProps} />);

        const panel = screen.getByText('🔍').closest('.search-panel');
        expect(panel).toHaveClass('idle');
    });

    it('should show first-run guidance when idle and expanded', () => {
        render(<SearchPanel {...defaultProps} />);

        expect(screen.getByText(/Buscá en el barrio/i)).toBeInTheDocument();
        expect(
            screen.getByText(/Ver Todo/i, { selector: '.search-empty-hint' })
        ).toBeInTheDocument();

        const note = screen.getByRole('note');
        expect(note).toHaveClass('search-empty-state');
    });

    it('should remove first-run guidance once a query is typed', () => {
        const { rerender } = render(<SearchPanel {...defaultProps} />);

        // Precondition: the guidance is shown before typing
        expect(screen.getByText(/Buscá en el barrio/i)).toBeInTheDocument();

        const input = screen.getByRole('combobox', { name: 'Buscar' });
        fireEvent.change(input, { target: { value: '86' } });

        // Controlled input: simulate the parent wiring the new query back in
        rerender(<SearchPanel {...defaultProps} searchQuery="86" />);

        expect(screen.queryByText(/Buscá en el barrio/i)).not.toBeInTheDocument();
        expect(screen.queryByRole('note')).not.toBeInTheDocument();
    });

    it('should highlight active search type button', () => {
        const props = {
            ...defaultProps,
            searchType: 'departamento' as SearchType,
        };

        render(<SearchPanel {...props} />);

        const departamentoButton = screen.getByText('🚪 Departamento').closest('button');
        expect(departamentoButton).toHaveClass('active');
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

    it('should expose an accessible search input and live results feedback', () => {
        const { rerender } = render(<SearchPanel {...defaultProps} />);

        // The query input has an accessible name even without a visible label
        // (explicit role="combobox" replaces the implicit textbox role)
        expect(screen.getByRole('combobox', { name: 'Buscar' })).toBeInTheDocument();

        rerender(
            <SearchPanel
                {...defaultProps}
                appliedQuery="Torre"
                appliedType="edificio"
                searchResults={5}
            />
        );

        // The results-count feedback is announced to screen readers
        expect(screen.getByText('5 resultados encontrados').closest('.search-indicator')).toHaveAttribute('aria-live', 'polite');
    });

    describe('suggestions combobox', () => {
        const suggestionProps = {
            ...defaultProps,
            suggestions: [{ value: '86' }, { value: '8' }],
        };

        it('should render the suggestion listbox when the input is focused and suggestions exist', () => {
            render(<SearchPanel {...suggestionProps} />);

            const input = screen.getByRole('combobox', { name: 'Buscar' });
            fireEvent.focus(input);

            const listbox = screen.getByRole('listbox');
            expect(listbox).toHaveAttribute('id', 'search-suggestions-listbox');
            expect(input).toHaveAttribute('aria-controls', 'search-suggestions-listbox');
            expect(input).toHaveAttribute('aria-expanded', 'true');
            expect(input).toHaveAttribute('aria-autocomplete', 'list');

            const options = screen.getAllByRole('option');
            expect(options).toHaveLength(2);
            expect(options[0]).toHaveTextContent('86');
            expect(options[1]).toHaveTextContent('8');
        });

        it('should not render the listbox when there are no suggestions', () => {
            render(<SearchPanel {...defaultProps} />);

            const input = screen.getByRole('combobox', { name: 'Buscar' });
            fireEvent.focus(input);

            expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
            expect(input).toHaveAttribute('aria-expanded', 'false');
        });

        it('should open the listbox as the user types in a focused empty input', () => {
            // Real as-you-type flow: focus lands on an empty input (no
            // suggestions yet), the first keystroke produces suggestions in
            // the parent, and the list must open without requiring ArrowDown.
            const { rerender } = render(<SearchPanel {...defaultProps} />);

            const input = screen.getByRole('combobox', { name: 'Buscar' });
            fireEvent.focus(input);
            expect(input).toHaveAttribute('aria-expanded', 'false');

            fireEvent.change(input, { target: { value: '5' } });
            rerender(<SearchPanel {...suggestionProps} searchQuery="5" />);

            expect(screen.getByRole('listbox')).toBeInTheDocument();
            expect(input).toHaveAttribute('aria-expanded', 'true');
        });

        it('should highlight the first option on ArrowDown', () => {
            render(<SearchPanel {...suggestionProps} />);

            const input = screen.getByRole('combobox', { name: 'Buscar' });
            fireEvent.keyDown(input, { key: 'ArrowDown' });

            expect(input).toHaveAttribute('aria-activedescendant', 'suggestion-option-0');
            expect(screen.getAllByRole('option')[0]).toHaveAttribute('aria-selected', 'true');
            expect(screen.getAllByRole('option')[1]).toHaveAttribute('aria-selected', 'false');
        });

        it('should move the highlight up with ArrowUp and unhighlight past the first option', () => {
            render(<SearchPanel {...suggestionProps} />);

            const input = screen.getByRole('combobox', { name: 'Buscar' });
            fireEvent.keyDown(input, { key: 'ArrowDown' });
            fireEvent.keyDown(input, { key: 'ArrowDown' });
            fireEvent.keyDown(input, { key: 'ArrowUp' });

            expect(input).toHaveAttribute('aria-activedescendant', 'suggestion-option-0');

            fireEvent.keyDown(input, { key: 'ArrowUp' });

            expect(input).not.toHaveAttribute('aria-activedescendant');
            // The list stays open even when nothing is highlighted
            expect(screen.getByRole('listbox')).toBeInTheDocument();
        });

        it('should select the highlighted option on Enter without submitting', () => {
            render(<SearchPanel {...suggestionProps} />);

            const input = screen.getByRole('combobox', { name: 'Buscar' });
            fireEvent.focus(input);
            fireEvent.keyDown(input, { key: 'ArrowDown' });
            fireEvent.keyDown(input, { key: 'Enter' });

            expect(defaultProps.onSuggestionSelect).toHaveBeenCalledWith('86');
            expect(defaultProps.onSubmit).not.toHaveBeenCalled();
        });

        it('should still submit on Enter when the list is open but nothing is highlighted', () => {
            render(<SearchPanel {...suggestionProps} />);

            const input = screen.getByRole('combobox', { name: 'Buscar' });
            fireEvent.focus(input);
            fireEvent.keyDown(input, { key: 'Enter' });

            expect(defaultProps.onSubmit).toHaveBeenCalled();
            expect(defaultProps.onSuggestionSelect).not.toHaveBeenCalled();
        });

        it('should close the list on Escape without clearing the query', () => {
            const props = {
                ...suggestionProps,
                searchQuery: '8',
            };

            render(<SearchPanel {...props} />);

            const input = screen.getByRole('combobox', { name: 'Buscar' });
            fireEvent.focus(input);
            expect(input).toHaveAttribute('aria-expanded', 'true');

            fireEvent.keyDown(input, { key: 'Escape' });

            expect(input).toHaveAttribute('aria-expanded', 'false');
            expect(input).toHaveValue('8');
            expect(defaultProps.onQueryChange).not.toHaveBeenCalled();
        });

        it('should call onSuggestionSelect when an option is clicked', () => {
            render(<SearchPanel {...suggestionProps} />);

            const input = screen.getByRole('combobox', { name: 'Buscar' });
            fireEvent.focus(input);

            const options = screen.getAllByRole('option');
            const firstOption = options[0];
            if (!firstOption) throw new Error('expected at least one suggestion option');
            fireEvent.click(firstOption);

            expect(defaultProps.onSuggestionSelect).toHaveBeenCalledWith('86');
        });
    });
});
