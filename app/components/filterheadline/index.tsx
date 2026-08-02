import { Box, Button, Typography } from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import FilterListOffIcon from "@mui/icons-material/FilterListOff";
import type { ReactNode } from "react";

type ResponsiveOffset = Record<string, string | number>;

interface FilterHeadlineProps {
  title: string;
  subtitle?: string;
  filterOn: boolean;
  onToggleFilter: () => void;
  children: ReactNode;
  titleVariant?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  subtitleVariant?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  titleColor?: string;
  topOffset?: string | number | ResponsiveOffset;
}

const FilterHeadline = ({
  title,
  subtitle,
  filterOn,
  onToggleFilter,
  children,
  titleVariant = "h4",
  subtitleVariant = "h5",
  titleColor = "white",
  topOffset = { lg: "120px", xs: "72px" },
}: FilterHeadlineProps) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        justifyContent: "space-between",
        marginBottom: "8px",
        bgcolor: "primary.light",
        borderRadius: "4px",
        width: "100%",
        height: { xs: "auto", md: "90px" },
        position: "sticky",
        top: topOffset,
        zIndex: "1",
      }}
    >
      <Box
        sx={{
          display: { xs: "flex", lg: "block" },
          flexDirection: "row",
          justifyContent: "space-between",
          width: { xs: "100%", lg: "calc(100% - 128px)" },
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Typography
            variant={titleVariant}
            sx={{
              color: titleColor,
              padding: "4px 24px 4px 8px",
              fontSize: { sm: "2.5rem", xs: "2rem" },
            }}
          >
            {title}
          </Typography>
          <Typography
            variant={subtitleVariant}
            sx={{
              color: titleColor,
              padding: "2px 24px 4px 8px",
              fontSize: { sm: "1rem", xs: "0.5rem" },
            }}
          >
            {subtitle}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          onClick={onToggleFilter}
          sx={{
            color: "white",
            border: "none",
            "&:hover": {
              border: "none",
              backgroundColor: "rgba(255,255,255,0.1)",
            },
            margin: "8px",
            textTransform: "none",
            display: { xs: "flex", lg: "none" },
          }}
          endIcon={filterOn ? <FilterListOffIcon /> : <FilterListIcon />}
        >
          Filter
        </Button>
      </Box>
      <Box
        sx={
          filterOn
            ? {
                display: "flex",
                flexDirection: "row",
                flexWrap: "wrap",
              }
            : { display: { xs: "none", lg: "flex" } }
        }
      >
        {children}
      </Box>
    </Box>
  );
};

export default FilterHeadline;
