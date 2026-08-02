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
  /** The selected option, an empty string means the filter is inactive. */
  selected: string;
};

export type FilterState<T> = {
  filters: Filter[];
  filteredItems: T[];
  activeFilterCount: number;
  setFilter: (filterId: string, option: string) => void;
  clearFilters: () => void;
};

const naturalCompare = (left: string, right: string) => left.localeCompare(right, "de", { numeric: true, sensitivity: "base" });

const uniqueSorted = (values: string[], compare: (left: string, right: string) => number) => Array.from(new Set(values)).sort(compare);

/**
 * Generic filter state for a list of items. Options are derived from the items themselves,
 * therefore they stay in sync whenever the underlying data (redux store) changes.
 *
 * Every filter holds a single selected option, the active filters are combined with AND.
 */
export default function useFilterState<T>(items: T[], definitions: FilterDefinition<T>[]): FilterState<T> {
  const [selection, setSelection] = useState<Record<string, string>>({});

  const filters = useMemo<Filter[]>(
    () =>
      definitions
        .map((definition) => {
          const options = uniqueSorted(
            items.flatMap((item) => definition.extract(item)),
            definition.compare ?? naturalCompare,
          );
          // Options can disappear when the data changes, a stale selection is ignored.
          const selected = selection[definition.id] ?? "";

          return {
            id: definition.id,
            label: definition.label,
            options,
            selected: options.includes(selected) ? selected : "",
          };
        })
        // Filters without options (or with a single option) do not narrow anything down.
        .filter((filter) => filter.options.length > 1),
    [definitions, items, selection],
  );

  const filteredItems = useMemo(() => {
    const activeFilters = filters.filter((filter) => filter.selected !== "");

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

        return definition.extract(item).includes(filter.selected);
      }),
    );
  }, [definitions, filters, items]);

  const setFilter = useCallback((filterId: string, option: string) => {
    setSelection((currentSelection) => ({ ...currentSelection, [filterId]: option }));
  }, []);

  const clearFilters = useCallback(() => setSelection({}), []);

  const activeFilterCount = filters.reduce((count, filter) => count + (filter.selected === "" ? 0 : 1), 0);

  return { filters, filteredItems, activeFilterCount, setFilter, clearFilters };
}
