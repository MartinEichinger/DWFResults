"use client";

import Badge from "@mui/material/Badge";
import Button from "@mui/material/Button";
import FilterListIcon from "@mui/icons-material/FilterList";

interface SelectButtonProps {
  filterOn: boolean;
  activeFilterCount?: number;
  onToggle: () => void;
}

export default function SelectButton({ filterOn, activeFilterCount = 0, onToggle }: SelectButtonProps) {
  return (
    <Badge badgeContent={activeFilterCount} color="primary">
      <Button
        variant={filterOn ? "contained" : "outlined"}
        size="small"
        startIcon={<FilterListIcon />}
        onClick={onToggle}
        aria-expanded={filterOn}
        sx={{ whiteSpace: "nowrap" }}
      >
        Filter
      </Button>
    </Badge>
  );
}
