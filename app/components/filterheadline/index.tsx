"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

interface FilterHeadlineProps {
  label: string;
  selectedCount?: number;
}

export default function FilterHeadline({ label, selectedCount = 0 }: FilterHeadlineProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "4px" }}>
      <Typography variant="subtitle2" sx={{ fontWeight: "600", color: "text.secondary" }}>
        {label}
      </Typography>
      {selectedCount > 0 && (
        <Typography variant="caption" color="primary.main">
          ({selectedCount})
        </Typography>
      )}
    </Box>
  );
}
