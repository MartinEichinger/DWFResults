"use client";

import * as React from "react";
import Chip from "@mui/material/Chip";

type FilterChipProps = {
  listdata: { label: string };
  filter: string;
  setFilter: (value: string) => void;
};

const FilterChip: React.FC<FilterChipProps> = ({ listdata, filter, setFilter }) => {
  const selected = filter === listdata.label;

  return (
    <Chip
      label={listdata.label}
      size="small"
      clickable
      onClick={() => setFilter(selected ? "" : listdata.label)}
      color={selected ? "primary" : "default"}
      variant={selected ? "filled" : "outlined"}
      aria-pressed={selected}
      sx={{
        marginRight: "8px",
        marginBottom: "8px",
      }}
    />
  );
};

export default FilterChip;
