import { useCallback, useMemo, useState } from "react";

/**
 * Describes a single filter: how its options are derived from an item and which label
 * is shown in the filter bar.
 */
export type FilterDefinition<T> = {
  id: string;
  label: string;
  /** Returns all values of an item this filter can match on. */
  extract: (item: T) => string[];
  /** Optional custom sorting of the options, defaults to a natural (numeric aware) sort. */
  compare?: (left: string, right: string) => number;
};

export type Filter = {
  id: string;
  label: string;
  options: string[];
  selected: string[];
};

export type FilterState<T> = {
  filters: Filter[];
  filteredItems: T[];
  activeFilterCount: number;
  toggleOption: (filterId: string, option: string) => void;
  clearFilters: () => void;
};

const naturalCompare = (left: string, right: string) => left.localeCompare(right, "de", { numeric: true, sensitivity: "base" });

const uniqueSorted = (values: string[], compare: (left: string, right: string) => number) => Array.from(new Set(values)).sort(compare);

/**
 * Generic filter state for a list of items. Options are derived from the items themselves,
 * therefore they stay in sync whenever the underlying data (redux store) changes.
 *
 * Multiple options of the same filter are combined with OR, different filters with AND.
 */
export default function useFilterState<T>(items: T[], definitions: FilterDefinition<T>[]): FilterState<T> {
  const [selection, setSelection] = useState<Record<string, string[]>>({});

  const filters = useMemo<Filter[]>(
    () =>
      definitions
        .map((definition) => {
          const options = uniqueSorted(
            items.flatMap((item) => definition.extract(item)),
            definition.compare ?? naturalCompare,
          );
          // Options can disappear when the data changes, stale selections are ignored.
          const selected = (selection[definition.id] ?? []).filter((option) => options.includes(option));

          return {
            id: definition.id,
            label: definition.label,
            options,
            selected,
          };
        })
        // Filters without options (or with a single option) do not narrow anything down.
        .filter((filter) => filter.options.length > 1),
    [definitions, items, selection],
  );

  const filteredItems = useMemo(() => {
    const activeFilters = filters.filter((filter) => filter.selected.length > 0);

    if (activeFilters.length === 0) {
      return items;
    }

    const definitionsById = new Map(definitions.map((definition) => [definition.id, definition]));

    return items.filter((item) =>
      activeFilters.every((filter) => {
        const definition = definitionsById.get(filter.id);

        if (!definition) {
          return true;
        }

        const values = definition.extract(item);

        return filter.selected.some((option) => values.includes(option));
      }),
    );
  }, [definitions, filters, items]);

  const toggleOption = useCallback((filterId: string, option: string) => {
    setSelection((currentSelection) => {
      const selected = currentSelection[filterId] ?? [];
      const nextSelected = selected.includes(option) ? selected.filter((entry) => entry !== option) : [...selected, option];

      return { ...currentSelection, [filterId]: nextSelected };
    });
  }, []);

  const clearFilters = useCallback(() => setSelection({}), []);

  const activeFilterCount = filters.reduce((count, filter) => count + filter.selected.length, 0);

  return { filters, filteredItems, activeFilterCount, toggleOption, clearFilters };
}
