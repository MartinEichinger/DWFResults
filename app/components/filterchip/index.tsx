"use client";

import * as React from "react";
import Chip from "@mui/material/Chip";

type FilterChipProps = {
  listdata: { label: string };
  filter: string;
  setFilter: (value: string) => void;
};

const FilterChip: React.FC<FilterChipProps> = ({ listdata, filter, setFilter }) => {
  return (
    <Chip
      variant="outlined"
      label={`${listdata.label}: ${filter}`}
      onDelete={() => setFilter("")}
      sx={{
        width: "fit-content",
        borderRadius: "3px",
        margin: "0px 8px 16px 0px",
        backgroundColor: "white",
        color: "primary.light",
        borderColor: "primary.light",
        "& .MuiChip-deleteIcon": {
          color: "primary.light",
          "&:hover": {
            color: "primary.dark",
          },
        },
      }}
    />
  );
};

export default FilterChip;
