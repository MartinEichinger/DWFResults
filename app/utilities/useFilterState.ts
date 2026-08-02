"use client";

import { useMemo, useState } from "react";

export type FilterValues = Record<string, string>;

export type FilterDefinition<T> = {
  key: string;
  label: string;
  getOptions: (items: T[]) => string[];
  getValue: (item: T) => string | string[];
};

const normalizeFilterValue = (value: string | string[] | undefined | null) => {
  if (Array.isArray(value)) {
    return value.map((entry) =>
      String(entry ?? "")
        .trim()
        .toLocaleLowerCase(),
    );
  }

  return String(value ?? "")
    .trim()
    .toLocaleLowerCase();
};

const useFilterState = <T>(items: T[] | undefined, definitions: FilterDefinition<T>[]) => {
  const [values, setValues] = useState<FilterValues>({});
  const safeItems = useMemo(() => (Array.isArray(items) ? items : []), [items]);

  const activeFilters = useMemo(() => definitions.filter((definition) => Boolean(values[definition.key])), [definitions, values]);

  const optionsByKey = useMemo(
    () => Object.fromEntries(definitions.map((definition) => [definition.key, definition.getOptions(safeItems)])),
    [definitions, safeItems],
  );

  const filteredItems = useMemo(() => {
    return safeItems.filter((item) => {
      return definitions.every((definition) => {
        const selectedValue = values[definition.key];
        if (!selectedValue) return true;

        const itemValue = definition.getValue(item);
        const itemValues = Array.isArray(itemValue) ? itemValue : [itemValue];
        const normalizedSelectedValue = normalizeFilterValue(selectedValue);

        return itemValues.some((value) => normalizeFilterValue(value) === normalizedSelectedValue);
      });
    });
  }, [definitions, safeItems, values]);

  const setFilter = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilter = (key: string) => {
    setValues((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  return {
    values,
    setFilter,
    clearFilter,
    activeFilters,
    optionsByKey,
    filteredItems,
  };
};

export default useFilterState;
