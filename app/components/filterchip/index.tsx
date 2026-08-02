"use client";

import Chip from "@mui/material/Chip";

interface FilterChipProps {
  label: string;
  selected: boolean;
  onToggle: () => void;
}

export default function FilterChip({ label, selected, onToggle }: FilterChipProps) {
  return (
    <Chip
      label={label}
      size="small"
      clickable
      onClick={onToggle}
      color={selected ? "primary" : "default"}
      variant={selected ? "filled" : "outlined"}
      aria-pressed={selected}
      sx={{
        marginRight: "8px",
        marginBottom: "8px",
      }}
    />
  );
}
